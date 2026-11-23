import type { Aussehen } from "@/lib/einstellungen";
import type { Meldung } from "@/lib/kacheln/ki-news/feed";
import type { KiNewsDaten } from "@/lib/kacheln/typen";
import { istFrisch } from "@/lib/zeit";

export type NeueMeldung = {
  absender: string;
  aussehen: Aussehen;
  meldung: Meldung;
};

// Alle Meldungen mit dem Etikett „Neu“ über alle Absender, neueste zuerst (Übersicht „Heute“, ADR 0014).
export function kiNewsKurz(daten: KiNewsDaten, jetzt: Date): NeueMeldung[] {
  return daten.absender
    .flatMap(({ name, aussehen, meldungen }) =>
      meldungen
        .filter((meldung) => istFrisch(meldung.zeit, jetzt, meldung.nurDatum))
        .map((meldung) => ({ absender: name, aussehen, meldung })),
    )
    .sort((a, b) => Date.parse(b.meldung.zeit) - Date.parse(a.meldung.zeit));
}
