// Immer deutsche Zeit: Der Server von Vercel läuft in UTC, und die Anzeige soll überall gleich sein.
const ZEITZONE = "Europe/Berlin";

const UHRZEIT = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const DATUM = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function uhrzeit(iso: string): string {
  return UHRZEIT.format(new Date(iso));
}

export function datum(iso: string): string {
  return DATUM.format(new Date(iso));
}

// Bei einem Stand von einem anderen Tag gehört das Datum dazu, sonst sieht er aus wie von heute.
export function standText(iso: string, jetzt: Date = new Date()): string {
  return datum(iso) === datum(jetzt.toISOString())
    ? uhrzeit(iso)
    : `${datum(iso)}, ${uhrzeit(iso)}`;
}

const STUNDE_MS = 60 * 60 * 1000;
const TAG_MS = 24 * STUNDE_MS;

const KALENDERTAG = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Einzelne Teile statt Text: Das Format eines Datums hängt von den Sprachdaten des Browsers ab.
function kalendertag(zeit: Date): number {
  const teil = (art: string) =>
    Number(KALENDERTAG.formatToParts(zeit).find((t) => t.type === art)?.value);
  return Date.UTC(teil("year"), teil("month") - 1, teil("day"));
}

function tageZurueck(iso: string, jetzt: Date): number {
  return Math.round((kalendertag(jetzt) - kalendertag(new Date(iso))) / TAG_MS);
}

// nurDatum: Die Quelle nennt keine Uhrzeit. Frisch sind dann heute und gestern, weil ein Beitrag vom Abend in
// den USA bei uns am Morgen schon „gestern“ heißt.
export function istFrisch(
  iso: string,
  jetzt: Date = new Date(),
  nurDatum = false,
): boolean {
  if (nurDatum) return tageZurueck(iso, jetzt) <= 1;
  return jetzt.getTime() - Date.parse(iso) < TAG_MS;
}

// Unter einem Tag zählen Stunden, damit Text und Punkt für „frisch“ zusammenpassen. Ohne Uhrzeit nur Kalendertage.
export function alterText(
  iso: string,
  jetzt: Date = new Date(),
  nurDatum = false,
): string {
  const abstand = jetzt.getTime() - Date.parse(iso);
  if (!nurDatum && abstand < STUNDE_MS) {
    return `vor ${Math.max(1, Math.floor(abstand / 60_000))} Min.`;
  }
  if (!nurDatum && abstand < TAG_MS) {
    return `vor ${Math.floor(abstand / STUNDE_MS)} Std.`;
  }
  const tage = tageZurueck(iso, jetzt);
  if (tage <= 0) return "heute";
  return tage === 1 ? "gestern" : `vor ${tage} Tagen`;
}
