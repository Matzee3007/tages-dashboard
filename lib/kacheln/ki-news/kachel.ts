import { ABSENDER, type KiNewsEinstellung } from "@/lib/einstellungen";
import { ladeKiNews, type AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import type { KachelDaten } from "@/lib/kacheln/typen";
import { erstelleLeseClient } from "@/lib/supabase/server";
import { leseZusammenfassungen } from "@/lib/zusammenfassen/speicher";

// Die Zusammenfassungen erzeugt der Mac (ADR 0010). Fehlen sie, zeigt die Kachel die Meldungen wie bisher.
async function mitZusammenfassungen(
  staende: AbsenderStand[],
): Promise<AbsenderStand[]> {
  const links = staende.flatMap((stand) =>
    stand.meldungen.map((meldung) => meldung.link),
  );
  let texte: Map<string, string>;
  try {
    texte = await leseZusammenfassungen(await erstelleLeseClient(), links);
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
