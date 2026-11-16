import type { LigaEinstellung } from "@/lib/einstellungen";
import { ladeLiga } from "@/lib/kacheln/liga/laden";
import type { KachelDaten } from "@/lib/kacheln/typen";

// Eigene Datei, damit Tests ladeLiga durch eine Attrappe ersetzen können.
export async function ladeLigaKachel(
  einstellung: LigaEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  return { daten: await ladeLiga(einstellung, jetzt) };
}
