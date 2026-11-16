import type { DashboardAntwort, KachelAnzeige } from "@/lib/kacheln/typen";

// antwort null heißt: Der Abruf ist gescheitert, keine Kachel hat neue Daten.
export function neuerStand(
  bisher: KachelAnzeige[],
  antwort: DashboardAntwort | null,
): KachelAnzeige[] {
  if (antwort === null) {
    return bisher.map((kachel) => ({ ...kachel, fehler: true }));
  }

  return antwort.kacheln.map((kachel) => {
    const { id, titel, aussehen, gruppe } = kachel;
    const kopf = { id, titel, aussehen, ...(gruppe && { gruppe }) };
    if (kachel.status === "ok") {
      const { zusatz, daten, stand } = kachel;
      return { ...kopf, zusatz, daten, stand, fehler: false };
    }
    const alt = bisher.find((vorher) => vorher.id === id);
    return {
      ...kopf,
      zusatz: alt?.zusatz,
      daten: alt?.daten ?? null,
      stand: alt?.stand ?? null,
      fehler: true,
    };
  });
}
