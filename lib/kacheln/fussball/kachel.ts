import type { FussballEinstellung } from "@/lib/einstellungen";
import { ladeFussball } from "@/lib/kacheln/fussball/laden";
import type { FussballDaten } from "@/lib/kacheln/fussball/typen";
import type { KachelDaten } from "@/lib/kacheln/typen";
import { leseSpielberichte } from "@/lib/spielbericht/speicher";
import { erstelleLeseClient } from "@/lib/supabase/server";
import { mitZeitlimit } from "@/lib/zeitlimit";

// Supabase bekommt höchstens 2 Sekunden, wie bei den Zusammenfassungen der KI-News.
const LESE_ZEITLIMIT_MS = 2000;

// Die Spielberichte erzeugt der Mac (ADR 0013). Fehlen sie, zeigt die Kachel die Partien wie bisher.
async function mitSpielberichten(daten: FussballDaten): Promise<FussballDaten> {
  const beendet = daten.partien
    .filter((partie) => partie.status === "vorbei")
    .map((partie) => partie.id);
  if (!beendet.length) return daten;
  let berichte: Map<string, string>;
  try {
    berichte = await mitZeitlimit(
      erstelleLeseClient().then((client) => leseSpielberichte(client, beendet)),
      LESE_ZEITLIMIT_MS,
    );
  } catch (fehler) {
    console.error("Spielberichte ließen sich nicht lesen:", fehler);
    return daten;
  }
  return {
    ...daten,
    partien: daten.partien.map((partie) => {
      const bericht = berichte.get(partie.id);
      return bericht ? { ...partie, bericht } : partie;
    }),
  };
}

// Eigene Datei, damit Tests ladeFussball durch eine Attrappe ersetzen können.
export async function ladeFussballKachel(
  einstellung: FussballEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  return {
    daten: await mitSpielberichten(await ladeFussball(einstellung, jetzt)),
  };
}
