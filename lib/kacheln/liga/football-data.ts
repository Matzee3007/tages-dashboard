import type { Team } from "@/lib/einstellungen";
import type { TabellenZeile } from "@/lib/kacheln/bundesliga/typen";
import { heute } from "@/lib/zeit";

// Liest die Schnittstelle von football-data.org, Version 4 (ADR 0011). Felder laut Antworten vom 2026-11-16.

function falscheForm(): never {
  throw new Error("Unerwartete Antwort von football-data.org");
}

type FdPartie = { utcDate?: string; matchday?: number };

// Tag "YYYY-MM-DD" (deutsche Zeit) → höchste Nummer eines Spieltags an diesem Tag, wie leseSpielplan für OpenLigaDB.
export function leseFdSpielplan(json: unknown): Map<string, number> {
  const partien = (json as { matches?: unknown })?.matches;
  if (!Array.isArray(partien)) falscheForm();
  const spielplan = new Map<string, number>();
  for (const partie of partien as FdPartie[]) {
    const zeit = Date.parse(partie.utcDate ?? "");
    const nummer = partie.matchday;
    if (Number.isNaN(zeit) || typeof nummer !== "number") continue;
    const tag = heute(new Date(zeit));
    spielplan.set(tag, Math.max(nummer, spielplan.get(tag) ?? 0));
  }
  return spielplan;
}

type FdTabellenZeile = {
  position?: number;
  team?: { id?: number; shortName?: string; crest?: string };
  playedGames?: number;
  goalDifference?: number;
  points?: number;
};

// id und Name über die Team-Liste, damit Mein Team (ids von ESPN) die Zeile erkennt. Nach Platz sortiert.
export function leseFdTabelle(json: unknown, teams: Team[]): TabellenZeile[] {
  const gesamt = (
    json as { standings?: { type?: string; table?: unknown }[] }
  )?.standings?.find((stand) => stand.type === "TOTAL")?.table;
  if (!Array.isArray(gesamt)) falscheForm();
  return (gesamt as FdTabellenZeile[])
    .map((roh) => {
      const fdId = roh.team?.id ?? falscheForm();
      const team = teams.find((t) => t.footballData === fdId);
      if (!team) console.error(`Team ${fdId} fehlt in der Liste`);
      return {
        platz: roh.position ?? 0,
        id: team?.espn ?? `fd-${fdId}`,
        name: team?.name ?? roh.team?.shortName ?? "",
        logo: roh.team?.crest ?? null,
        spiele: roh.playedGames ?? 0,
        differenz: roh.goalDifference ?? 0,
        punkte: roh.points ?? 0,
      };
    })
    .sort((a, b) => a.platz - b.platz);
}
