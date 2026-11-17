import type { SupabaseClient } from "@supabase/supabase-js";
import type { Modell } from "@/lib/modell";
import { ABSENDER } from "@/lib/einstellungen";
import type { Meldung } from "@/lib/kacheln/ki-news/feed";
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
  modell: Modell,
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
    try {
      if (await fasseEineZusammen(client, modell, meldung)) {
        ergebnis.neu++;
        continue;
      }
    } catch (fehler) {
      // Ist das Modell gar nicht erreichbar (fetch wirft TypeError), scheitert jeder weitere Artikel auch: abbrechen.
      // Zeitlimit oder Fehler beim Speichern betreffen nur diesen Artikel (Review von PR #61).
      if (fehler instanceof TypeError) throw fehler;
      console.error(`Ohne Zusammenfassung: ${meldung.link}`, fehler);
    }
    ergebnis.ohne++;
  }
  return ergebnis;
}

// true: gespeichert. false: kein Artikel oder Antwort verworfen.
async function fasseEineZusammen(
  client: SupabaseClient,
  modell: Modell,
  meldung: Meldung,
): Promise<boolean> {
  const artikel = await ladeArtikel(meldung.link);
  const zusammenfassung =
    artikel && (await fasseZusammen(artikel, meldung.titel, modell));
  if (!artikel || !zusammenfassung) {
    console.log(
      `Ohne Zusammenfassung: ${meldung.link} (${artikel ? "Antwort verworfen" : "kein Artikel"})`,
    );
    return false;
  }
  await speichereZusammenfassung(client, {
    link: meldung.link,
    zusammenfassung,
    modell: modell.name,
    gekuerzt: artikel.gekuerzt,
  });
  return true;
}
