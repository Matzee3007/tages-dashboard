import { ABSENDER, type KachelEinstellung } from "@/lib/einstellungen";
import { ladeKiNews } from "@/lib/kacheln/ki-news/laden";
import type { KachelDaten } from "@/lib/kacheln/typen";

// Eigene Datei, damit Tests ladeKiNews durch eine Attrappe ersetzen können.
export async function ladeKiNewsKachel(
  _einstellung: KachelEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  return {
    daten: { art: "ki-news", absender: await ladeKiNews(ABSENDER, jetzt) },
  };
}
