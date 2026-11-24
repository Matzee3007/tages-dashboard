import {
  wichtigstePartie,
  type FussballKurz,
  type TeamKurz,
} from "@/lib/kacheln/fussball/kurz";
import type { NflDaten, NflZeile } from "@/lib/kacheln/nfl/typen";

// „6–4“, mit Unentschieden „6–4–1“.
export function bilanz(zeile: NflZeile): string {
  return [zeile.siege, zeile.niederlagen, zeile.unentschieden || null]
    .filter((wert) => wert !== null)
    .join("–");
}

// Das Wichtigste der NFL für „Heute“ in derselben Form wie beim Fußball (ADR 0014). Chip: „6–4 · Seed 8“.
export function nflKurz(daten: NflDaten): FussballKurz {
  return {
    live: daten.partien.filter((partie) => partie.status === "laeuft"),
    meinTeam: daten.meinTeam.map((id): TeamKurz => {
      const partie = wichtigstePartie(
        daten.partien.filter(
          (partie) => partie.heim.id === id || partie.gast.id === id,
        ),
      );
      const stand =
        partie && (partie.heim.id === id ? partie.heim : partie.gast);
      const zeile = daten.division?.find((zeile) => zeile.id === id);
      const frei = daten.spielfrei.find((team) => team.id === id);
      return {
        id,
        name: stand?.name ?? zeile?.name ?? frei?.name ?? id,
        logo: stand?.logo ?? zeile?.logo ?? frei?.logo ?? null,
        partie,
        platz: zeile
          ? {
              text:
                zeile.seed === null
                  ? bilanz(zeile)
                  : `${bilanz(zeile)} · Seed ${zeile.seed}`,
              zone:
                daten.zonen.find(
                  ({ von, bis }) =>
                    zeile.seed !== null &&
                    von <= zeile.seed &&
                    zeile.seed <= bis,
                ) ?? null,
            }
          : null,
      };
    }),
  };
}
