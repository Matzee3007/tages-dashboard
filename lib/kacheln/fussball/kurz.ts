import type { Zone } from "@/lib/einstellungen";
import type {
  FussballDaten,
  Partie,
  TabellenZeile,
} from "@/lib/kacheln/fussball/typen";

// text: was der Chip in „Heute“ zeigt, z. B. „Platz 1 · 31 Pkt“ (NFL: „6–4 · Seed 8“).
export type Platz = { text: string; zone: Zone | null };

export type TeamKurz = {
  id: string;
  name: string;
  logo: string | null;
  partie: Partie | null;
  platz: Platz | null;
};

// Das Wichtigste einer Fußball-Kachel für die Übersicht „Heute“ (ADR 0014).
export type FussballKurz = { live: Partie[]; meinTeam: TeamKurz[] };

export function fussballKurz(daten: FussballDaten): FussballKurz {
  return {
    live: daten.partien.filter((partie) => partie.status === "laeuft"),
    meinTeam: daten.meinTeam.map((id) => teamKurz(daten, id)),
  };
}

function teamKurz(daten: FussballDaten, id: string): TeamKurz {
  const partie = wichtigstePartie(
    daten.partien.filter(
      (partie) => partie.heim.id === id || partie.gast.id === id,
    ),
  );
  const zeile = daten.tabelle?.find(
    (zeile): zeile is TabellenZeile => zeile?.id === id,
  );
  const stand = partie && (partie.heim.id === id ? partie.heim : partie.gast);
  return {
    id,
    name: stand?.name ?? zeile?.name ?? id,
    logo: stand?.logo ?? zeile?.logo ?? null,
    partie,
    platz: zeile
      ? {
          text: `Platz ${zeile.platz} · ${zeile.punkte} Pkt`,
          zone:
            daten.zonen.find(
              (zone) => zone.von <= zeile.platz && zeile.platz <= zone.bis,
            ) ?? null,
        }
      : null,
  };
}

// Laufend vor der nächsten (früheste zuerst), sonst die letzte. Abgesagte zählen nie.
function wichtigstePartie(partien: Partie[]): Partie | null {
  const nachAnstoss = [...partien].sort(
    (a, b) => Date.parse(a.anstoss) - Date.parse(b.anstoss),
  );
  return (
    nachAnstoss.find((partie) => partie.status === "laeuft") ??
    nachAnstoss.find((partie) => partie.status === "vorher") ??
    nachAnstoss.findLast((partie) => partie.status === "vorbei") ??
    null
  );
}
