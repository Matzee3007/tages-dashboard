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
  // Je Saison, damit die Winterpause im Januar den Endstand der Vorsaison zeigt.
  fahrer: (saison: number) => `${JOLPICA}/${saison}/driverStandings.json`,
  teams: (saison: number) => `${JOLPICA}/${saison}/constructorStandings.json`,
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
// Ohne Uhrzeit (neu veröffentlichte Kalender) zählt nur der Tag: ohneZeit, kein „läuft“, keine Uhrzeit in der Ansicht.
function mitStart(session: Omit<Session, "start">, termin: Termin): Session {
  return {
    ...session,
    start: start(termin),
    ...(!termin.time && { ohneZeit: true as const }),
  };
}

// Die Saison des Kalenders, auch wenn er noch leer ist (z. B. „2027“ im Januar).
export function leseSaison(json: unknown): number {
  const saison = (json as { MRData?: { RaceTable?: { season?: string } } })
    ?.MRData?.RaceTable?.season;
  return Number(saison ?? falscheForm());
}

export function leseKalender(json: unknown): Rennen[] {
  return rennen(json).map((roh) => {
    const sessions: Session[] = SESSIONS.flatMap(({ feld, art, name }) => {
      const termin = roh[feld] as Termin | undefined;
      return termin
        ? [mitStart({ art, name, status: "vorher" as const }, termin)]
        : [];
    });
    sessions.push(
      mitStart({ art: "rennen", name: "Rennen", status: "vorher" }, roh),
    );
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

// Die ersten 10 der Startaufstellung mit der besten Zeit aus Q3, Q2 oder Q1. Vor dem Qualifying: keine Zeilen.
export function leseQualifying(json: unknown): ErgebnisZeile[] {
  if (rennen(json).length === 0) return [];
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

// Die ersten 10 des Rennens: Sieger mit Gesamtzeit, sonst Abstand. Überrundete („Lapped“, Jolpica 2026) nach Runden zum Sieger,
// auch wenn sie eine Zeit tragen. „Ausfall“ für alles andere ohne Zeit oder mit Status wie „Retired“.
// Vor dem Ende des Rennens: keine Zeilen.
export function leseErgebnis(json: unknown): ErgebnisZeile[] {
  if (rennen(json).length === 0) return [];
  const liste = (
    rennen(json)[0] as
      | {
          Results?: (RoheZeile & {
            status?: string;
            laps?: string;
            Time?: { time?: string };
          })[];
        }
      | undefined
  )?.Results;
  if (!Array.isArray(liste)) falscheForm();
  const siegerRunden = Number(liste[0]?.laps ?? 0);
  return liste.slice(0, 10).map((roh) => {
    const zurueck =
      Number(roh.status?.match(/^\+(\d+) Laps?$/)?.[1] ?? 0) ||
      (roh.status === "Lapped" ? siegerRunden - Number(roh.laps ?? 0) : 0);
    const gewertet = roh.status === "Finished" || roh.status === "Lapped";
    const zeit =
      zurueck > 0
        ? `+${zurueck} Rd.`
        : gewertet && roh.Time?.time
          ? komma(roh.Time.time)
          : "Ausfall";
    return zeile(roh, zeit);
  });
}

// WM-Wertung der Fahrer (mit Team) oder der Teams.
export function leseWertung(
  json: unknown,
  art: "fahrer" | "teams",
): { nachRunde: number; zeilen: WertungsZeile[] } {
  const listen = (
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
  )?.MRData?.StandingsTable?.StandingsLists;
  if (!Array.isArray(listen)) falscheForm();
  // Vor dem ersten Rennen einer Saison gibt es noch keine Wertung.
  if (listen.length === 0) return { nachRunde: 0, zeilen: [] };
  const liste = listen[0];
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
