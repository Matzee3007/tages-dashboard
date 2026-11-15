import { ABSENDER, type KiNewsEinstellung } from "@/lib/einstellungen";
import { ladeKiNews, type AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import type { KachelDaten } from "@/lib/kacheln/typen";
import { erstelleLeseClient } from "@/lib/supabase/server";
import { mitZeitlimit } from "@/lib/zeitlimit";
import { leseZusammenfassungen } from "@/lib/zusammenfassen/speicher";

// Die Kachel hat insgesamt 8 Sekunden, die Feeds davon bis zu 5. Supabase bekommt höchstens 2, damit Luft bleibt.
const LESE_ZEITLIMIT_MS = 2000;

// Die Zusammenfassungen erzeugt der Mac (ADR 0010). Fehlen sie, zeigt die Kachel die Meldungen wie bisher.
async function mitZusammenfassungen(
  staende: AbsenderStand[],
): Promise<AbsenderStand[]> {
  const links = staende.flatMap((stand) =>
    stand.meldungen.map((meldung) => meldung.link),
  );
  let texte: Map<string, string>;
  try {
    texte = await mitZeitlimit(
      erstelleLeseClient().then((client) =>
        leseZusammenfassungen(client, links),
      ),
      LESE_ZEITLIMIT_MS,
    );
  } catch (fehler) {
    console.error("Zusammenfassungen ließen sich nicht lesen:", fehler);
    return staende;
  }
  return staende.map((stand) => ({
    ...stand,
    meldungen: stand.meldungen.map((meldung) => {
      const zusammenfassung = texte.get(meldung.link);
      return zusammenfassung ? { ...meldung, zusammenfassung } : meldung;
    }),
  }));
}

// Eigene Datei, damit Tests ladeKiNews durch eine Attrappe ersetzen können.
export async function ladeKiNewsKachel(
  einstellung: KiNewsEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  const staende = await ladeKiNews(ABSENDER, jetzt, einstellung.id);
  return {
    daten: { art: "ki-news", absender: await mitZusammenfassungen(staende) },
  };
}
