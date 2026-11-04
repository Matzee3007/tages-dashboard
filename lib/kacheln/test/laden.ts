import type { KachelEinstellung } from "@/lib/einstellungen";
import type { KachelDaten } from "@/lib/kacheln/typen";
import { uhrzeitMitSekunden } from "@/lib/zeit";

export async function ladeTestkachel(
  einstellung: KachelEinstellung,
  jetzt: Date,
): Promise<{ zusatz?: string; daten: KachelDaten }> {
  if (einstellung.fehlerAusloesen) {
    throw new Error("Testfehler");
  }
  return {
    zusatz: "Server",
    daten: { art: "test", uhrzeit: uhrzeitMitSekunden(jetzt.toISOString()) },
  };
}
