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

const ABRUF_ZEITLIMIT_MS = 10000;

// Jeder Fehler (Zeitlimit, Netz, Status) heißt: diesmal keine Zusammenfassung, der nächste Durchlauf versucht es neu.
export async function ladeArtikel(url: string): Promise<ArtikelText | null> {
  try {
    const antwort = await fetch(url, {
      headers: { "User-Agent": "Tages-Dashboard" },
      signal: AbortSignal.timeout(ABRUF_ZEITLIMIT_MS),
    });
    if (!antwort.ok) {
      console.error(`Artikel ${url}: Status ${antwort.status}`);
      return null;
    }
    return leseArtikel(await antwort.text(), url);
  } catch (fehler) {
    console.error(`Artikel ${url} ließ sich nicht laden:`, fehler);
    return null;
  }
}
