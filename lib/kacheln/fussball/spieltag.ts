import type { Partie, TabellenZeile } from "@/lib/kacheln/fussball/typen";
import { folgetag, heute } from "@/lib/zeit";

// Spieltag wählen und benennen (Projektvision, Entscheidungen der Befragung vom 2026-11-08).

// Aufeinanderfolgende Tage mit Spielen bilden einen Block (tage aufsteigend sortiert).
// Wechselt die Nummer im Spielplan, beginnt ein neuer Block, auch ohne Lücke.
function bloecke(
  tage: string[],
  spielplan: Map<string, number> | null,
): string[][] {
  const ergebnis: string[][] = [];
  for (const tag of tage) {
    const letzter = ergebnis.at(-1);
    const vortag = letzter?.at(-1);
    const gleicheNummer =
      spielplan?.get(vortag!) === undefined ||
      spielplan.get(tag) === undefined ||
      spielplan.get(vortag!) === spielplan.get(tag);
    if (letzter && folgetag(vortag!) === tag && gleicheNummer)
      letzter.push(tag);
    else ergebnis.push([tag]);
  }
  return ergebnis;
}

// Ein Spieltag bleibt bis Mitternacht (deutsche Zeit) des Tages nach seinem letzten Spiel aktuell,
// höchstens bis der nächste beginnt.
export function waehleSpieltag(
  tage: string[],
  spielplan: Map<string, number> | null,
  jetzt: Date,
): string[] {
  const alle = bloecke(tage, spielplan);
  const tag = heute(jetzt);
  return (
    alle.find(
      (block, index) =>
        tag <= folgetag(block.at(-1)!) && !(tag >= alle[index + 1]?.[0]),
    ) ??
    alle.at(-1) ??
    []
  );
}

// "9. Spieltag", "Nachholspiel" (alle Partien gehören zu einem früheren Spieltag als dem zuletzt gespielten) oder null.
export function spieltagTitel(
  tage: string[],
  spielplan: Map<string, number> | null,
): string | null {
  if (!spielplan || tage.length === 0) return null;
  const nummern = tage.flatMap((tag) => spielplan.get(tag) ?? []);
  if (nummern.length === 0) return null;
  const nummer = Math.max(...nummern);
  const vorher = [...spielplan]
    .filter(([tag]) => tag < tage[0])
    .map(([, frueher]) => frueher);
  if (vorher.length > 0 && nummer < Math.max(...vorher)) return "Nachholspiel";
  return `${nummer}. Spieltag`;
}

// Partien mit Mein Team zuerst, dann nach Anstoß, bei gleichem Anstoß nach Heimteam.
export function sortierePartien(
  partien: Partie[],
  meinTeam: string[],
): Partie[] {
  const mitMeinTeam = (partie: Partie) =>
    meinTeam.includes(partie.heim.id) || meinTeam.includes(partie.gast.id)
      ? 0
      : 1;
  return [...partien].sort(
    (a, b) =>
      mitMeinTeam(a) - mitMeinTeam(b) ||
      Date.parse(a.anstoss) - Date.parse(b.anstoss) ||
      a.heim.name.localeCompare(b.heim.name, "de"),
  );
}

// Platz 1 und Mein Team mit je 2 Plätzen darüber und darunter, null steht für eine Lücke. Ohne Mein Team Plätze 1–5.
export function tabellenAusschnitt(
  tabelle: TabellenZeile[],
  meinTeam: string[],
): (TabellenZeile | null)[] {
  const gezeigt = new Set([0]);
  tabelle.forEach((zeile, index) => {
    if (!meinTeam.includes(zeile.id)) return;
    for (let nah = index - 2; nah <= index + 2; nah++) gezeigt.add(nah);
  });
  if (gezeigt.size === 1) [1, 2, 3, 4].forEach((index) => gezeigt.add(index));

  const ausschnitt: (TabellenZeile | null)[] = [];
  tabelle.forEach((zeile, index) => {
    if (!gezeigt.has(index)) return;
    if (index > 0 && !gezeigt.has(index - 1)) ausschnitt.push(null);
    ausschnitt.push(zeile);
  });
  return ausschnitt;
}
