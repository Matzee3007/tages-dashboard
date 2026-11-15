import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

export const MAX_ARTIKEL_ZEICHEN = 20000;
// Weniger ist kein Artikel, sondern eine Seite ohne Text, z. B. ein Video.
const MIN_ARTIKEL_ZEICHEN = 200;

export type ArtikelText = { text: string; gekuerzt: boolean };

// Readability ist die Leseansicht von Firefox: Sie findet den Haupttext ohne eigenen Code je Website (ADR 0010).
export function leseArtikel(html: string, url: string): ArtikelText | null {
  // Ohne eigene Konsole schreibt jsdom jeden CSS- und Skriptfehler der Seite ins Log.
  const dom = new JSDOM(html, { url, virtualConsole: new VirtualConsole() });
  const text = (new Readability(dom.window.document).parse()?.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < MIN_ARTIKEL_ZEICHEN) return null;
  return {
    text: text.slice(0, MAX_ARTIKEL_ZEICHEN),
    gekuerzt: text.length > MAX_ARTIKEL_ZEICHEN,
  };
}
