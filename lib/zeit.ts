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
