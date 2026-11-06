// Immer deutsche Zeit: Der Server von Vercel läuft in UTC, und die Anzeige soll überall gleich sein.
const ZEITZONE = "Europe/Berlin";

const UHRZEIT = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const UHRZEIT_MIT_SEKUNDEN = new Intl.DateTimeFormat("de-DE", {
  timeZone: ZEITZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
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

export function uhrzeitMitSekunden(iso: string): string {
  return UHRZEIT_MIT_SEKUNDEN.format(new Date(iso));
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

// en-CA schreibt JJJJ-MM-TT, das lässt sich als Tag parsen.
const KALENDERTAG = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZEITZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function kalendertag(zeit: Date): number {
  return Date.parse(KALENDERTAG.format(zeit));
}

export function istFrisch(iso: string, jetzt: Date = new Date()): boolean {
  return jetzt.getTime() - Date.parse(iso) < TAG_MS;
}

// Unter einem Tag zählen Stunden, damit Text und Punkt für „frisch“ zusammenpassen.
export function alterText(iso: string, jetzt: Date = new Date()): string {
  const abstand = jetzt.getTime() - Date.parse(iso);
  if (abstand < STUNDE_MS) {
    return `vor ${Math.max(1, Math.floor(abstand / 60_000))} Min.`;
  }
  if (abstand < TAG_MS) return `vor ${Math.floor(abstand / STUNDE_MS)} Std.`;
  const tage = Math.round(
    (kalendertag(jetzt) - kalendertag(new Date(iso))) / TAG_MS,
  );
  return tage <= 1 ? "gestern" : `vor ${tage} Tagen`;
}
