// Spieltag wählen und benennen (Projektvision, Entscheidungen der Befragung vom 2026-11-08).
import type { Partie } from "@/lib/kacheln/bundesliga/typen";

const HEUTE = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" });

function folgetag(tag: string): string {
  const zeit = new Date(`${tag}T12:00:00Z`);
  zeit.setUTCDate(zeit.getUTCDate() + 1);
  return zeit.toISOString().slice(0, 10);
}

// Aufeinanderfolgende Tage mit Spielen bilden einen Block (tage aufsteigend sortiert).
function bloecke(tage: string[]): string[][] {
  const ergebnis: string[][] = [];
  for (const tag of tage) {
    const letzter = ergebnis.at(-1);
    if (letzter && folgetag(letzter.at(-1)!) === tag) letzter.push(tag);
    else ergebnis.push([tag]);
  }
  return ergebnis;
}

// Ein Spieltag bleibt bis Mitternacht (deutsche Zeit) des Tages nach seinem letzten Spiel aktuell.
export function waehleSpieltag(tage: string[], jetzt: Date): string[] {
  const heute = HEUTE.format(jetzt);
  const alle = bloecke(tage);
  return (
    alle.find((block) => heute <= folgetag(block.at(-1)!)) ?? alle.at(-1) ?? []
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
