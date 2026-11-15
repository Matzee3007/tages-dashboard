import type { SupabaseClient } from "@supabase/supabase-js";
import { ABSENDER } from "@/lib/einstellungen";
import { ladeKiNews } from "@/lib/kacheln/ki-news/laden";
import { ladeArtikel } from "@/lib/zusammenfassen/artikel";
import { fasseZusammen } from "@/lib/zusammenfassen/modell";
import {
  leseZusammenfassungen,
  speichereZusammenfassung,
} from "@/lib/zusammenfassen/speicher";

// neu: gespeichert. ohne: übersprungen (kein Artikel oder Antwort verworfen), der nächste Durchlauf versucht es neu.
export async function durchlauf(
  client: SupabaseClient,
  modell: { url: string; name: string },
  jetzt: Date,
): Promise<{ neu: number; ohne: number }> {
  // Genau die Meldungen, die die Kachel zeigt. So holt ein Mac, der eine Woche aus war, nichts rückwirkend nach.
  const staende = await ladeKiNews(ABSENDER, jetzt, "ki-news");
  const meldungen = staende.flatMap((stand) => stand.meldungen);
  const vorhanden = await leseZusammenfassungen(
    client,
    meldungen.map((meldung) => meldung.link),
  );

  const ergebnis = { neu: 0, ohne: 0 };
  // Nacheinander: Das Modell auf dem Mac schafft nur eine Anfrage gleichzeitig gut.
  for (const meldung of meldungen) {
    if (vorhanden.has(meldung.link)) continue;
    const artikel = await ladeArtikel(meldung.link);
    const zusammenfassung =
      artikel && (await fasseZusammen(artikel, meldung.titel, modell));
    if (!artikel || !zusammenfassung) {
      ergebnis.ohne++;
      continue;
    }
    await speichereZusammenfassung(client, {
      link: meldung.link,
      zusammenfassung,
      modell: modell.name,
      gekuerzt: artikel.gekuerzt,
    });
    ergebnis.neu++;
  }
  return ergebnis;
}
