import type { Partie, TeamStand, Tor } from "@/lib/kacheln/fussball/typen";
import type { NflZeile } from "@/lib/kacheln/nfl/typen";

// Liest die inoffizielle Schnittstelle von ESPN für die NFL (ADR 0009). Felder laut Antworten vom 2026-11-24.

const NFL = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

export const NFL_ADRESSEN = {
  kalender: `${NFL}/scoreboard`,
  woche: (nummer: number) => `${NFL}/scoreboard?week=${nummer}&seasontype=2`,
  tabelle:
    "https://site.api.espn.com/apis/v2/sports/football/nfl/standings?level=3",
  plays: (id: string) => `${NFL}/summary?event=${id}`,
};

const ABGESAGT = new Set(["STATUS_POSTPONED", "STATUS_CANCELED"]);

function falscheForm(): never {
  throw new Error("Unerwartete Antwort von ESPN");
}

export type Woche = { nummer: number; start: string; ende: string };

type EspnTeam = {
  id?: string;
  shortDisplayName?: string;
  logo?: string;
  logos?: { href?: string }[];
};

// Die Wochen der Regular Season aus dem Kalender.
export function leseWochen(json: unknown): Woche[] {
  const kalender = (
    json as {
      leagues?: {
        calendar?: {
          label?: string;
          entries?: { value?: string; startDate?: string; endDate?: string }[];
        }[];
      }[];
    }
  )?.leagues?.[0]?.calendar;
  const saison = kalender?.find(({ label }) => label === "Regular Season");
  if (!Array.isArray(saison?.entries)) falscheForm();
  return saison.entries.map((eintrag) => ({
    nummer: Number(eintrag.value ?? falscheForm()),
    start: eintrag.startDate ?? falscheForm(),
    ende: eintrag.endDate ?? falscheForm(),
  }));
}

function team(roh: EspnTeam | undefined, tore: number | null): TeamStand {
  return {
    id: roh?.id ?? falscheForm(),
    name: roh?.shortDisplayName ?? "",
    logo: roh?.logo ?? roh?.logos?.[0]?.href ?? null,
    tore,
  };
}

type EspnSpiel = {
  id?: string;
  date?: string;
  status?: {
    displayClock?: string;
    period?: number;
    type?: { state?: string; name?: string };
  };
  competitions?: {
    competitors?: { homeAway?: string; score?: string; team?: EspnTeam }[];
  }[];
};

// „Q3 8:42“, nach dem 4. Viertel „OT 3:10“, in der Pause „Halbzeit“.
function spielzeit(status: EspnSpiel["status"]): string {
  if (status?.type?.name === "STATUS_HALFTIME") return "Halbzeit";
  const periode = status?.period ?? 0;
  const viertel = periode > 4 ? "OT" : `Q${periode}`;
  return `${viertel} ${status?.displayClock ?? ""}`.trim();
}

// Partien der Woche und die Teams, die spielfrei haben (Bye). Status-Regel wie beim Fußball.
export function leseWoche(
  json: unknown,
  jetzt: Date,
): { partien: Partie[]; spielfrei: TeamStand[] } {
  const daten = json as {
    events?: EspnSpiel[];
    week?: { teamsOnBye?: EspnTeam[] };
  };
  if (!Array.isArray(daten?.events)) falscheForm();
  const partien = daten.events.map((roh): Partie => {
    const teilnehmer = roh.competitions?.[0]?.competitors ?? [];
    const anstoss = roh.date ?? falscheForm();
    const zustand = roh.status?.type?.state;
    const status: Partie["status"] = ABGESAGT.has(roh.status?.type?.name ?? "")
      ? "abgesagt"
      : zustand === "post"
        ? "vorbei"
        : zustand === "in" ||
            (zustand === "pre" && Date.parse(anstoss) <= jetzt.getTime())
          ? "laeuft"
          : "vorher";
    const angepfiffen = status === "laeuft" || status === "vorbei";
    const seite = (art: "home" | "away") => {
      const roheSeite = teilnehmer.find((t) => t.homeAway === art);
      return team(
        roheSeite?.team,
        angepfiffen ? Number(roheSeite?.score ?? 0) : null,
      );
    };
    return {
      id: roh.id ?? falscheForm(),
      anstoss,
      status,
      minute: zustand === "in" ? spielzeit(roh.status) : null,
      heim: seite("home"),
      gast: seite("away"),
      tore: [],
    };
  });
  return {
    partien,
    spielfrei: (daten.week?.teamsOnBye ?? []).map((roh) => team(roh, null)),
  };
}

type EspnGruppe = {
  name?: string;
  children?: EspnGruppe[];
  standings?: {
    entries?: {
      team?: EspnTeam;
      stats?: { name?: string; value?: number }[];
    }[];
  };
};

function zeilen(gruppe: EspnGruppe): NflZeile[] {
  return (gruppe.standings?.entries ?? []).map((eintrag) => {
    const wert = (name: string) =>
      eintrag.stats?.find((stat) => stat.name === name)?.value ?? 0;
    const { id, name, logo } = team(eintrag.team, null);
    return {
      seed: wert("playoffSeed"),
      id,
      name,
      logo,
      siege: wert("wins"),
      niederlagen: wert("losses"),
      unentschieden: wert("ties"),
    };
  });
}

// Tabelle mit level=3: Conferences mit je vier Divisions. Beide nach Seed sortiert.
export function leseTabellen(
  json: unknown,
  division: string,
  conference: string,
): { division: NflZeile[]; conference: NflZeile[] } {
  const roheConference = (json as EspnGruppe)?.children?.find(
    ({ name }) => name === conference,
  );
  const roheDivision = roheConference?.children?.find(
    ({ name }) => name === division,
  );
  if (!roheConference || !roheDivision) falscheForm();
  const nachSeed = (a: NflZeile, b: NflZeile) => a.seed - b.seed;
  return {
    division: zeilen(roheDivision).sort(nachSeed),
    conference: (roheConference.children ?? []).flatMap(zeilen).sort(nachSeed),
  };
}

// „Tee Higgins 31 Yd pass from Joe Burrow (Evan McPherson Kick)“ → „Higgins 31 Yd pass“: ohne Vorname, Passgeber und Zusatz.
function playText(text: string): string {
  return text
    .replace(/\s*\(.*$/, "")
    .replace(/\s+from\s+.*$/, "")
    .replace(/^\S+\s+/, "");
}

// Punkte-Spielzüge einer Partie als Zeilen wie Torschützen: „Q2 1:55 TD Higgins 31 Yd pass“, Seite nach dem Team.
export function leseScoringPlays(
  json: unknown,
  heimId: string,
  gastId: string,
): Tor[] {
  const plays = (
    json as {
      scoringPlays?: {
        type?: { abbreviation?: string };
        text?: string;
        period?: { number?: number };
        clock?: { displayValue?: string };
        team?: { id?: string };
      }[];
    }
  )?.scoringPlays;
  if (!Array.isArray(plays)) falscheForm();
  return plays.map((play) => {
    const periode = play.period?.number ?? 0;
    const viertel = periode > 4 ? "OT" : `Q${periode}`;
    const teile = [
      viertel,
      play.clock?.displayValue,
      play.type?.abbreviation,
      playText(play.text ?? ""),
    ].filter(Boolean);
    const id = play.team?.id;
    if (id !== heimId && id !== gastId)
      console.error(`Play mit unbekanntem Team ${id}`);
    return { text: teile.join(" "), seite: id === gastId ? "gast" : "heim" };
  });
}
