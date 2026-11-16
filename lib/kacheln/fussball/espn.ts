import type { Team } from "@/lib/einstellungen";
import type {
  Partie,
  TabellenZeile,
  TeamStand,
} from "@/lib/kacheln/fussball/typen";
import { heute } from "@/lib/zeit";

// Liest die inoffizielle Schnittstelle von ESPN (ADR 0009). Felder laut Antworten vom 2026-11-08.

const ESPN = "https://site.api.espn.com/apis";

// Adresse einer Liga bei ESPN, z. B. espnAdresse("scoreboard", "eng.1").
export function espnAdresse(
  art: "scoreboard" | "standings",
  liga: string,
): string {
  const pfad = art === "scoreboard" ? "site/v2" : "v2";
  return `${ESPN}/${pfad}/sports/soccer/${liga}/${art}`;
}

// Statusnamen von ESPN für Partien, die nicht wie geplant stattfinden.
const ABGESAGT = new Set(["STATUS_POSTPONED", "STATUS_CANCELED"]);

function falscheForm(): never {
  throw new Error("Unerwartete Antwort von ESPN");
}

// Tage mit Spielen, z. B. "2026-11-06T08:00Z" → "2026-11-06".
export function leseKalender(json: unknown): string[] {
  const kalender = (json as { leagues?: { calendar?: unknown }[] })
    ?.leagues?.[0]?.calendar;
  if (!Array.isArray(kalender)) falscheForm();
  return kalender
    .map((eintrag) => (typeof eintrag === "string" ? eintrag : falscheForm()))
    .map((eintrag) => eintrag.slice(0, 10))
    .sort();
}

// Tage der Partien einer Antwort nach deutscher Zeit, z. B. aus dem Standardabruf ohne Datum (aktueller oder nächster Tag).
export function leseTageDerPartien(json: unknown): string[] {
  const partien = (json as { events?: { date?: string }[] })?.events;
  if (!Array.isArray(partien)) falscheForm();
  const tage = partien.map((partie) => {
    const zeit = Date.parse(partie.date ?? "");
    return Number.isNaN(zeit) ? falscheForm() : heute(new Date(zeit));
  });
  return [...new Set(tage)].sort();
}

type EspnTeam = {
  homeAway?: string;
  score?: string;
  team?: { id?: string; shortDisplayName?: string; logo?: string };
};

type EspnDetail = {
  scoringPlay?: boolean;
  ownGoal?: boolean;
  penaltyKick?: boolean;
  clock?: { displayValue?: string };
  team?: { id?: string };
  athletesInvolved?: { shortName?: string }[];
};

type EspnPartie = {
  id?: string;
  date?: string;
  status?: { displayClock?: string; type?: { state?: string; name?: string } };
  competitions?: { competitors?: EspnTeam[]; details?: EspnDetail[] }[];
};

function teamName(id: string, espnName: string, teams: Team[]): string {
  const name = teams.find((team) => team.espn === id)?.name;
  if (name) return name;
  console.error(`Team ${id} fehlt in der Namensliste`);
  return espnName;
}

function teamStand(
  roh: EspnTeam | undefined,
  angepfiffen: boolean,
  teams: Team[],
): TeamStand {
  const id = roh?.team?.id ?? falscheForm();
  return {
    id,
    name: teamName(id, roh?.team?.shortDisplayName ?? "", teams),
    logo: roh?.team?.logo ?? null,
    tore: angepfiffen ? Number(roh?.score ?? 0) : null,
  };
}

// "A. García" → "García", "90'+2'" → "90+2'". Eigentor (ET) und Elfmeter (E) bekommen einen Zusatz.
function torText(detail: EspnDetail): string {
  const name = (detail.athletesInvolved?.[0]?.shortName ?? "").replace(
    /^\S+\.\s+/,
    "",
  );
  const minute = (detail.clock?.displayValue ?? "").replace("'+", "+");
  const zusatz = detail.ownGoal ? " (ET)" : detail.penaltyKick ? " (E)" : "";
  return `${name} ${minute}${zusatz}`;
}

export function leseTag(json: unknown, jetzt: Date, teams: Team[]): Partie[] {
  const partien = (json as { events?: EspnPartie[] })?.events;
  if (!Array.isArray(partien)) falscheForm();
  return partien.map((roh) => {
    const wettkampf = roh.competitions?.[0];
    const teilnehmer = wettkampf?.competitors ?? [];
    const gastId = teilnehmer.find((t) => t.homeAway === "away")?.team?.id;
    const anstoss = roh.date ?? falscheForm();
    const zustand = roh.status?.type?.state;
    // ESPN meldet den Anpfiff manchmal verspätet: pre nach dem Anstoß zählt schon als laufend.
    const status: Partie["status"] = ABGESAGT.has(roh.status?.type?.name ?? "")
      ? "abgesagt"
      : zustand === "post"
        ? "vorbei"
        : zustand === "in" ||
            (zustand === "pre" && Date.parse(anstoss) <= jetzt.getTime())
          ? "laeuft"
          : "vorher";
    const angepfiffen = status === "laeuft" || status === "vorbei";
    return {
      id: roh.id ?? falscheForm(),
      anstoss,
      status,
      minute: zustand === "in" ? (roh.status?.displayClock ?? null) : null,
      heim: teamStand(
        teilnehmer.find((t) => t.homeAway === "home"),
        angepfiffen,
        teams,
      ),
      gast: teamStand(
        teilnehmer.find((t) => t.homeAway === "away"),
        angepfiffen,
        teams,
      ),
      tore: (wettkampf?.details ?? [])
        .filter((detail) => detail.scoringPlay)
        .map((detail) => ({
          text: torText(detail),
          seite: detail.team?.id === gastId ? "gast" : "heim",
        })),
    };
  });
}

type EspnTabellenEintrag = {
  team?: {
    id?: string;
    shortDisplayName?: string;
    logos?: { href?: string }[];
  };
  stats?: { name?: string; value?: number }[];
};

// Nach Platz sortiert, weil die Reihenfolge der Antwort nicht dokumentiert ist.
export function leseTabelle(json: unknown, teams: Team[]): TabellenZeile[] {
  const eintraege = (
    json as { children?: { standings?: { entries?: EspnTabellenEintrag[] } }[] }
  )?.children?.[0]?.standings?.entries;
  if (!Array.isArray(eintraege)) falscheForm();
  return eintraege
    .map((eintrag) => {
      const id = eintrag.team?.id ?? falscheForm();
      const wert = (name: string) =>
        eintrag.stats?.find((stat) => stat.name === name)?.value ?? 0;
      return {
        platz: wert("rank"),
        id,
        name: teamName(id, eintrag.team?.shortDisplayName ?? "", teams),
        logo: eintrag.team?.logos?.[0]?.href ?? null,
        spiele: wert("gamesPlayed"),
        differenz: wert("pointDifferential"),
        punkte: wert("points"),
      };
    })
    .sort((a, b) => a.platz - b.platz);
}
