// Die Antwort des Modells ist fremder Text: Sie gilt erst nach dieser Prüfung als Spielbericht (ADR 0013).
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { istDeutsch, zaehleSaetze } from "@/lib/text";

const MIN_SAETZE = 4;
const MAX_SAETZE = 6;
const MAX_ZEICHEN = 900;

// "García 7'" → "García", "Bischof 30' (ET)" → "Bischof".
function schuetze(torText: string): string {
  return torText.replace(/\s+\d.*$/, "");
}

function leseAntwort(
  inhalt: string,
): { bericht: string; spieler: string[] } | null {
  let daten: unknown;
  try {
    daten = JSON.parse(inhalt);
  } catch {
    return null;
  }
  const { bericht, spieler } = (daten ?? {}) as Record<string, unknown>;
  if (typeof bericht !== "string" || !Array.isArray(spieler)) return null;
  if (!spieler.every((name) => typeof name === "string")) return null;
  return { bericht: bericht.trim(), spieler };
}

// spieler: alle Namen, die das Modell nach eigener Angabe nennt. Jeder muss im Liveticker stehen, sonst ist er erfunden.
export function pruefeBericht(
  inhalt: string,
  partie: Partie,
  liveticker: string[],
): string | null {
  const antwort = leseAntwort(inhalt);
  if (!antwort) return null;
  const { bericht, spieler } = antwort;
  const saetze = zaehleSaetze(bericht);
  const ticker = liveticker.join("\n");
  const gueltig =
    bericht.length <= MAX_ZEICHEN &&
    saetze >= MIN_SAETZE &&
    saetze <= MAX_SAETZE &&
    istDeutsch(bericht) &&
    bericht.includes(`${partie.heim.tore}:${partie.gast.tore}`) &&
    partie.tore.every((tor) => bericht.includes(schuetze(tor.text))) &&
    spieler.every((name) => ticker.includes(name) && bericht.includes(name));
  return gueltig ? bericht : null;
}
