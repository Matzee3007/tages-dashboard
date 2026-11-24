import type { Partie } from "@/lib/kacheln/fussball/typen";
import { folgetag, heute } from "@/lib/zeit";

// Spieltag wählen und benennen (Projektvision, Entscheidungen der Befragung vom 2026-11-08).

// Steigt die Nummer über die höchste bekannte des Blocks, beginnt ein neuer Spieltag. Ein Nachholspiel (kleinere
// Nummer) oder ein Tag ohne Nummer gehört zum laufenden Block.
function nummerSteigt(
  spielplan: Map<string, number> | null,
  block: string[],
  tag: string,
): boolean {
  const jetzt = spielplan?.get(tag);
  const bisher = block.flatMap((frueher) => spielplan?.get(frueher) ?? []);
  return (
    jetzt !== undefined && bisher.length > 0 && jetzt > Math.max(...bisher)
  );
}

// Aufeinanderfolgende Tage mit Spielen bilden einen Block (tage aufsteigend sortiert).
// Steigt die Nummer im Spielplan, beginnt ein neuer Block, auch ohne Lücke.
function bloecke(
  tage: string[],
  spielplan: Map<string, number> | null,
): string[][] {
  const ergebnis: string[][] = [];
  for (const tag of tage) {
    const letzter = ergebnis.at(-1);
    const vortag = letzter?.at(-1);
    if (
      letzter &&
      vortag &&
      folgetag(vortag) === tag &&
      !nummerSteigt(spielplan, letzter, tag)
    )
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
    alle.find((block, index) => {
      const naechsterBeginn = alle[index + 1]?.[0];
      return (
        tag <= folgetag(block.at(-1)!) &&
        (naechsterBeginn === undefined || tag < naechsterBeginn)
      );
    }) ??
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

// Der deutsche Kalendertag einer Partie ("YYYY-MM-DD"). Sortierung und Tageszeilen nutzen denselben Schlüssel.
export function spieltagTag(partie: Partie): string {
  return heute(new Date(partie.anstoss));
}

// Partien nach deutschem Tag, darin Mein Team zuerst, dann nach Anstoß, bei gleichem Anstoß nach Heimteam.
export function sortierePartien(
  partien: Partie[],
  meinTeam: string[],
): Partie[] {
  const mitMeinTeam = (partie: Partie) =>
    meinTeam.includes(partie.heim.id) || meinTeam.includes(partie.gast.id)
      ? 0
      : 1;
  // Erst nach deutschem Tag, darin Mein Team zuerst (Mock G, Entscheidung vom 2026-11-17).
  return [...partien].sort(
    (a, b) =>
      spieltagTag(a).localeCompare(spieltagTag(b)) ||
      mitMeinTeam(a) - mitMeinTeam(b) ||
      Date.parse(a.anstoss) - Date.parse(b.anstoss) ||
      a.heim.name.localeCompare(b.heim.name, "de"),
  );
}

// Platz 1 und Mein Team mit je 2 Plätzen darüber und darunter, null steht für eine Lücke. Ohne Mein Team Plätze 1–5.
// Gilt auch für die Conference der NFL (Plan NFL).
export function tabellenAusschnitt<Zeile extends { id: string }>(
  tabelle: Zeile[],
  meinTeam: string[],
): (Zeile | null)[] {
  const gezeigt = new Set([0]);
  tabelle.forEach((zeile, index) => {
    if (!meinTeam.includes(zeile.id)) return;
    for (let nah = index - 2; nah <= index + 2; nah++) gezeigt.add(nah);
  });
  if (gezeigt.size === 1) [1, 2, 3, 4].forEach((index) => gezeigt.add(index));

  const ausschnitt: (Zeile | null)[] = [];
  tabelle.forEach((zeile, index) => {
    if (!gezeigt.has(index)) return;
    if (index > 0 && !gezeigt.has(index - 1)) ausschnitt.push(null);
    ausschnitt.push(zeile);
  });
  return ausschnitt;
}
