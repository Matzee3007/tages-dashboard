import type { FussballEinstellung } from "@/lib/einstellungen";
import { ladeFussball } from "@/lib/kacheln/fussball/laden";
import type { KachelDaten } from "@/lib/kacheln/typen";

// Eigene Datei, damit Tests ladeFussball durch eine Attrappe ersetzen können.
export async function ladeFussballKachel(
  einstellung: FussballEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  return { daten: await ladeFussball(einstellung, jetzt) };
}
