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

function leseAntwort(inhalt: string): string | null {
  let daten: unknown;
  try {
    daten = JSON.parse(inhalt);
  } catch {
    return null;
  }
  const { bericht } = (daten ?? {}) as Record<string, unknown>;
  return typeof bericht === "string" ? bericht.trim() : null;
}

// Erfundene Spieler fängt die Prüfung nicht ab (ein Feld spieler füllte qwen3:4b mit allen Namen der Partie), das zeigt nur
// die Evaluation. Der Grund steht dort neben der Antwort.
export function pruefeMitGrund(
  inhalt: string,
  partie: Partie,
): { bericht: string } | { grund: string } {
  const bericht = leseAntwort(inhalt);
  if (bericht === null) return { grund: "kein gültiges JSON mit bericht" };
  const saetze = zaehleSaetze(bericht);
  const endstand = `${partie.heim.tore}:${partie.gast.tore}`;
  const ohneSchuetze = partie.tore
    .map((tor) => schuetze(tor.text))
    .filter((name) => !bericht.includes(name));
  if (bericht.length > MAX_ZEICHEN)
    return { grund: `${bericht.length} Zeichen` };
  if (saetze < MIN_SAETZE || saetze > MAX_SAETZE)
    return { grund: `${saetze} Sätze` };
  if (!istDeutsch(bericht)) return { grund: "nicht Deutsch" };
  if (!bericht.includes(endstand))
    return { grund: `Endstand ${endstand} fehlt` };
  if (ohneSchuetze.length)
    return { grund: `Torschütze fehlt: ${ohneSchuetze.join(", ")}` };
  return { bericht };
}

export function pruefeBericht(inhalt: string, partie: Partie): string | null {
  const ergebnis = pruefeMitGrund(inhalt, partie);
  return "bericht" in ergebnis ? ergebnis.bericht : null;
}
