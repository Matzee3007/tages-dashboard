import type { Woche } from "@/lib/kacheln/nfl/espn";
import { folgetag, heute } from "@/lib/zeit";

// Die Woche nach der Regel aller Wettbewerbe (Projektvision, Entscheidungen vom 2026-11-08): Sie bleibt bis Mitternacht
// (deutsche Zeit) des Tages nach ihrem letzten Spiel, höchstens bis die nächste beginnt. Der Kalender von ESPN wechselt
// schon am Mittwoch früh, deshalb kann die Vorwoche noch gelten.
// tageJeWoche: deutsche Spieltage einer schon geladenen Woche, sonst undefined. Ohne sie gilt die Woche des Kalenders.
export function waehleWoche(
  wochen: Woche[],
  tageJeWoche: (nummer: number) => string[] | undefined,
  jetzt: Date,
): number {
  const zeit = jetzt.getTime();
  const imKalender =
    wochen.find(
      ({ start, ende }) =>
        Date.parse(start) <= zeit && zeit <= Date.parse(ende),
    ) ?? (zeit < Date.parse(wochen[0].start) ? wochen[0] : wochen.at(-1)!);

  const tag = heute(jetzt);
  const ersterTag = tageJeWoche(imKalender.nummer)?.[0];
  const letzterTagVorher = tageJeWoche(imKalender.nummer - 1)?.at(-1);
  if (
    ersterTag !== undefined &&
    letzterTagVorher !== undefined &&
    tag < ersterTag &&
    tag <= folgetag(letzterTagVorher)
  ) {
    return imKalender.nummer - 1;
  }
  return imKalender.nummer;
}
