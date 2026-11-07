import { parse, type HTMLElement } from "node-html-parser";
import { istWebLink, type Meldung } from "@/lib/kacheln/ki-news/feed";

export type SeitenArt = "anthropic" | "claude-artikel" | "versionshinweise";

const MONATE = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

// Die Seiten nennen nur den Tag ("Nov 6, 2026"). 00:00 UTC, damit eine Meldung von heute nicht in der Zukunft liegt.
function datumAusText(text: string): string | null {
  const treffer = /^([a-z]+) (\d{1,2}), (\d{4})$/i.exec(text.trim());
  if (!treffer) return null;
  const monat = MONATE.indexOf(treffer[1].slice(0, 3).toLowerCase());
  if (monat < 0) return null;
  return new Date(
    Date.UTC(Number(treffer[3]), monat, Number(treffer[2])),
  ).toISOString();
}

function absoluterLink(href: string | undefined, url: string): string | null {
  if (!href) return null;
  try {
    const link = new URL(href, url).href;
    return istWebLink(link) ? link : null;
  } catch {
    return null;
  }
}

function titelAus(element: HTMLElement): string {
  return element.text.replace(/\s+/g, " ").trim();
}

function meldung(
  titel: string,
  link: string | null,
  zeit: string | null,
): Meldung[] {
  return titel && link && zeit ? [{ titel, link, zeit }] : [];
}

function leseAnthropic(wurzel: HTMLElement, url: string): Meldung[] {
  return wurzel.querySelectorAll("[data-listing-row]").flatMap((zeile) => {
    const ueberschrift = zeile.querySelector("h3");
    if (!ueberschrift) return [];
    const link =
      ueberschrift.closest("a") ?? ueberschrift.querySelector("a[href]");
    const zeit = zeile.querySelector("time");
    return meldung(
      titelAus(ueberschrift),
      absoluterLink(link?.getAttribute("href"), url),
      zeit ? datumAusText(zeit.text) : null,
    );
  });
}

const LESER: Record<
  SeitenArt,
  (wurzel: HTMLElement, url: string) => Meldung[]
> = {
  anthropic: leseAnthropic,
  "claude-artikel": () => {
    throw new Error("Unbekannte Bauart");
  },
  versionshinweise: () => {
    throw new Error("Unbekannte Bauart");
  },
};

export function leseSeite(
  art: SeitenArt,
  html: string,
  url: string,
): Meldung[] {
  const meldungen = LESER[art](parse(html), url);
  if (meldungen.length === 0) {
    throw new Error("Keine Meldung auf der Seite gefunden");
  }
  return meldungen;
}
