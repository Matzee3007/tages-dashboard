import { parse, type HTMLElement } from "node-html-parser";
import { istWebLink, type Meldung } from "@/lib/kacheln/ki-news/feed";

export type SeitenArt = "anthropic" | "claude-artikel" | "versionshinweise";

const MONATE = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

// Die Seiten nennen nur den Tag ("Nov 6, 2026"). 00:00 UTC, damit eine Meldung von heute nicht in der Zukunft liegt.
function datumAusText(text: string): string | null {
  const treffer = /^([a-z]+) (\d{1,2}), (\d{4})$/i.exec(text.trim());
  if (!treffer) return null;
  const wort = treffer[1].toLowerCase();
  const monat = MONATE.findIndex(
    (name) => name === wort || name.slice(0, 3) === wort,
  );
  const tag = Number(treffer[2]);
  const zeit = new Date(Date.UTC(Number(treffer[3]), monat, tag));
  // Ein unmöglicher Tag wie „Feb 31“ rollte sonst still in den nächsten Monat.
  if (monat < 0 || zeit.getUTCMonth() !== monat || zeit.getUTCDate() !== tag) {
    return null;
  }
  return zeit.toISOString();
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
  return titel && link && zeit ? [{ titel, link, zeit, nurDatum: true }] : [];
}

function leseAnthropic(wurzel: HTMLElement, url: string): Meldung[] {
  return wurzel.querySelectorAll("[data-listing-row]").flatMap((zeile) => {
    const ueberschrift = zeile.querySelector("h3");
    if (!ueberschrift) return [];
    // Erst der Link in der Überschrift, sonst einer um sie herum, aber nur aus dieser Zeile.
    const umschliessend = ueberschrift.closest("a[href]");
    const link =
      ueberschrift.querySelector("a[href]") ??
      (umschliessend &&
      zeile.querySelectorAll("a[href]").includes(umschliessend)
        ? umschliessend
        : null);
    const zeit = zeile.querySelector("time");
    return meldung(
      titelAus(ueberschrift),
      absoluterLink(link?.getAttribute("href"), url),
      zeit ? datumAusText(zeit.text) : null,
    );
  });
}

// claude.com: Jede Karte ist ein Link mit einem Datum in einem eigenen Element und der Überschrift.
function leseClaudeArtikel(wurzel: HTMLElement, url: string): Meldung[] {
  return wurzel.querySelectorAll("a[href]").flatMap((karte) => {
    const ueberschrift = karte.querySelector("h3");
    if (!ueberschrift) return [];
    const mitDatum = karte
      .querySelectorAll("*")
      .find((element) => datumAusText(element.text));
    const zeit = mitDatum ? datumAusText(mitDatum.text) : null;
    return meldung(
      titelAus(ueberschrift),
      absoluterLink(karte.getAttribute("href"), url),
      zeit,
    );
  });
}

// Hilfe-Center: Jede <h3> beginnt einen Tag, jeder ganz fette Absatz danach ist ein Eintrag.
// Alle Einträge eines Tages zeigen auf denselben Anker und werden eine Meldung.
function leseVersionshinweise(wurzel: HTMLElement, url: string): Meldung[] {
  const tage: { id: string; zeit: string | null; titel: string[] }[] = [];
  for (const element of wurzel.querySelectorAll("article h3, article p")) {
    if (element.tagName === "H3") {
      const id = element.getAttribute("id") ?? "";
      tage.push({ id, zeit: datumAusText(element.text), titel: [] });
      continue;
    }
    // Ganz fett: Ohne Leerraum ist der Absatz genau der Text seiner <b>-Teile.
    const ohneLeerraum = (text: string) => text.replace(/\s/g, "");
    const fett = element
      .querySelectorAll("b")
      .map((teil) => teil.text)
      .join("");
    const titel = titelAus(element);
    if (titel && ohneLeerraum(titel) === ohneLeerraum(fett)) {
      tage.at(-1)?.titel.push(titel);
    }
  }
  return tage.flatMap((tag) =>
    meldung(
      tag.titel.join(" · "),
      tag.id ? absoluterLink(`#${tag.id}`, url) : null,
      tag.zeit,
    ),
  );
}

const LESER: Record<
  SeitenArt,
  (wurzel: HTMLElement, url: string) => Meldung[]
> = {
  anthropic: leseAnthropic,
  "claude-artikel": leseClaudeArtikel,
  versionshinweise: leseVersionshinweise,
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
