import type { BundesligaEinstellung } from "@/lib/einstellungen";
import { ladeBundesliga } from "@/lib/kacheln/bundesliga/laden";
import type { KachelDaten } from "@/lib/kacheln/typen";

// Eigene Datei, damit Tests ladeBundesliga durch eine Attrappe ersetzen können.
export async function ladeBundesligaKachel(
  einstellung: BundesligaEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  return { daten: await ladeBundesliga(einstellung, jetzt) };
}
