import type {
  ErgebnisZeile,
  Rennen,
  Session,
  SessionArt,
  WertungsZeile,
} from "@/lib/kacheln/formel-1/typen";

// Liest Jolpica, den Nachfolger von Ergast (Plan Formel 1). Felder laut Antworten vom 2026-11-25.

const JOLPICA = "https://api.jolpi.ca/ergast/f1";

export const F1_ADRESSEN = {
  kalender: `${JOLPICA}/current.json`,
  saison: (jahr: number) => `${JOLPICA}/${jahr}.json`,
  qualifying: (saison: number, runde: number) =>
    `${JOLPICA}/${saison}/${runde}/qualifying.json`,
  ergebnis: (saison: number, runde: number) =>
    `${JOLPICA}/${saison}/${runde}/results.json`,
  fahrer: `${JOLPICA}/current/driverStandings.json`,
  teams: `${JOLPICA}/current/constructorStandings.json`,
};

// Deutsche Namen der Rennen. Fehlt einer, bleibt der englische.
const NAMEN: Record<string, string> = {
  "Australian Grand Prix": "Großer Preis von Australien",
  "Chinese Grand Prix": "Großer Preis von China",
  "Japanese Grand Prix": "Großer Preis von Japan",
  "Bahrain Grand Prix": "Großer Preis von Bahrain",
  "Saudi Arabian Grand Prix": "Großer Preis von Saudi-Arabien",
  "Miami Grand Prix": "Großer Preis von Miami",
  "Canadian Grand Prix": "Großer Preis von Kanada",
  "Monaco Grand Prix": "Großer Preis von Monaco",
  "Barcelona Grand Prix": "Großer Preis von Barcelona",
  "Austrian Grand Prix": "Großer Preis von Österreich",
  "British Grand Prix": "Großer Preis von Großbritannien",
  "Belgian Grand Prix": "Großer Preis von Belgien",
  "Hungarian Grand Prix": "Großer Preis von Ungarn",
  "Dutch Grand Prix": "Großer Preis der Niederlande",
  "Italian Grand Prix": "Großer Preis von Italien",
  "Spanish Grand Prix": "Großer Preis von Spanien",
  "Azerbaijan Grand Prix": "Großer Preis von Aserbaidschan",
  "Singapore Grand Prix": "Großer Preis von Singapur",
  "United States Grand Prix": "Großer Preis der USA",
  "Mexico City Grand Prix": "Großer Preis von Mexiko",
  "Brazilian Grand Prix": "Großer Preis von Brasilien",
  "Las Vegas Grand Prix": "Großer Preis von Las Vegas",
  "Qatar Grand Prix": "Großer Preis von Katar",
  "Abu Dhabi Grand Prix": "Großer Preis von Abu Dhabi",
};

const SESSIONS: { feld: string; art: SessionArt; name: string }[] = [
  { feld: "FirstPractice", art: "training1", name: "1. Training" },
  { feld: "SecondPractice", art: "training2", name: "2. Training" },
  { feld: "ThirdPractice", art: "training3", name: "3. Training" },
  {
    feld: "SprintQualifying",
    art: "sprintQualifying",
    name: "Sprint-Qualifying",
  },
  { feld: "Sprint", art: "sprint", name: "Sprint" },
  { feld: "Qualifying", art: "qualifying", name: "Qualifying" },
];

function falscheForm(): never {
  throw new Error("Unerwartete Antwort von Jolpica");
}

type Termin = { date?: string; time?: string };

type RohesRennen = Termin & {
  season?: string;
  round?: string;
  raceName?: string;
  Circuit?: { Location?: { locality?: string } };
} & Record<string, unknown>;

function start(termin: Termin): string {
  if (!termin.date) falscheForm();
  return `${termin.date}T${termin.time ?? "00:00:00Z"}`;
}

export function deutscherName(name: string): string {
  return NAMEN[name] ?? name;
}

function rennen(json: unknown): RohesRennen[] {
  const liste = (json as { MRData?: { RaceTable?: { Races?: RohesRennen[] } } })
    ?.MRData?.RaceTable?.Races;
  if (!Array.isArray(liste)) falscheForm();
  return liste;
}

// Alle Rennen einer Saison mit ihren Sessions, jede noch mit Status „vorher“ (den setzt wochenende.ts).
export function leseKalender(json: unknown): Rennen[] {
  return rennen(json).map((roh) => {
    const sessions: Session[] = SESSIONS.flatMap(({ feld, art, name }) => {
      const termin = roh[feld] as Termin | undefined;
      return termin
        ? [{ art, name, start: start(termin), status: "vorher" as const }]
        : [];
    });
    sessions.push({
      art: "rennen",
      name: "Rennen",
      start: start(roh),
      status: "vorher",
    });
    return {
      saison: Number(roh.season ?? falscheForm()),
      runde: Number(roh.round ?? falscheForm()),
      name: deutscherName(roh.raceName ?? falscheForm()),
      ort: roh.Circuit?.Location?.locality ?? "",
      sessions: sessions.sort(
        (a, b) => Date.parse(a.start) - Date.parse(b.start),
      ),
    };
  });
}

type RoheZeile = {
  position?: string;
  Driver?: { code?: string; familyName?: string };
  Constructor?: { name?: string };
};

function zeile(roh: RoheZeile, zeit: string): ErgebnisZeile {
  return {
    platz: Number(roh.position ?? falscheForm()),
    kuerzel: roh.Driver?.code ?? "",
    name: roh.Driver?.familyName ?? "",
    team: roh.Constructor?.name ?? "",
    zeit,
  };
}

const komma = (zeit: string) => zeit.replace(".", ",");

// Die ersten 10 der Startaufstellung mit der besten Zeit aus Q3, Q2 oder Q1.
export function leseQualifying(json: unknown): ErgebnisZeile[] {
  const liste = (
    rennen(json)[0] as
      | {
          QualifyingResults?: (RoheZeile & {
            Q1?: string;
            Q2?: string;
            Q3?: string;
          })[];
        }
      | undefined
  )?.QualifyingResults;
  if (!Array.isArray(liste)) falscheForm();
  return liste
    .slice(0, 10)
    .map((roh) => zeile(roh, komma(roh.Q3 ?? roh.Q2 ?? roh.Q1 ?? "")));
}

// Die ersten 10 des Rennens: Sieger mit Gesamtzeit, sonst Abstand, Überrundete „+1 Rd.“, sonst „Ausfall“.
export function leseErgebnis(json: unknown): ErgebnisZeile[] {
  const liste = (
    rennen(json)[0] as
      | {
          Results?: (RoheZeile & {
            status?: string;
            Time?: { time?: string };
          })[];
        }
      | undefined
  )?.Results;
  if (!Array.isArray(liste)) falscheForm();
  return liste.slice(0, 10).map((roh) => {
    const runden = roh.status?.match(/^\+(\d+) Laps?$/)?.[1];
    const zeit = roh.Time?.time
      ? komma(roh.Time.time)
      : runden
        ? `+${runden} Rd.`
        : "Ausfall";
    return zeile(roh, zeit);
  });
}

// WM-Wertung der Fahrer (mit Team) oder der Teams.
export function leseWertung(
  json: unknown,
  art: "fahrer" | "teams",
): { nachRunde: number; zeilen: WertungsZeile[] } {
  const liste = (
    json as {
      MRData?: {
        StandingsTable?: {
          StandingsLists?: {
            round?: string;
            DriverStandings?: (RoheZeile & {
              points?: string;
              Constructors?: { name?: string }[];
            })[];
            ConstructorStandings?: (RoheZeile & { points?: string })[];
          }[];
        };
      };
    }
  )?.MRData?.StandingsTable?.StandingsLists?.[0];
  const eintraege =
    art === "fahrer" ? liste?.DriverStandings : liste?.ConstructorStandings;
  if (!liste || !Array.isArray(eintraege)) falscheForm();
  return {
    nachRunde: Number(liste.round ?? falscheForm()),
    zeilen: eintraege.map((roh) => {
      const basis = {
        platz: Number(roh.position ?? falscheForm()),
        punkte: Number(roh.points ?? 0),
      };
      if (art === "teams")
        return {
          platz: basis.platz,
          name: roh.Constructor?.name ?? "",
          punkte: basis.punkte,
        };
      const team =
        (roh as { Constructors?: { name?: string }[] }).Constructors?.[0]
          ?.name ?? "";
      return {
        platz: basis.platz,
        name: roh.Driver?.familyName ?? "",
        team,
        punkte: basis.punkte,
      };
    }),
  };
}
