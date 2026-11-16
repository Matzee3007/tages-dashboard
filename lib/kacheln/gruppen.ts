import type { KachelAnzeige } from "@/lib/kacheln/typen";

export type Block = { gruppe: string | null; kacheln: KachelAnzeige[] };

// Aufeinanderfolgende Kacheln derselben Gruppe stehen zusammen, die Reihenfolge der Einstellungen bleibt (Glossar: Gruppe).
export function gruppiere(kacheln: KachelAnzeige[]): Block[] {
  const bloecke: Block[] = [];
  for (const kachel of kacheln) {
    const gruppe = kachel.gruppe ?? null;
    const letzter = bloecke.at(-1);
    if (gruppe !== null && letzter?.gruppe === gruppe) {
      letzter.kacheln.push(kachel);
    } else {
      bloecke.push({ gruppe, kacheln: [kachel] });
    }
  }
  return bloecke;
}
