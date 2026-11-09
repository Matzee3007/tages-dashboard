import { TEAMNAMEN } from "@/lib/einstellungen";
import type { Partie, TeamStand } from "@/lib/kacheln/bundesliga/typen";

// Liest die inoffizielle Schnittstelle von ESPN (ADR 0009). Felder laut Antworten vom 2026-11-08.

function falscheForm(): never {
  throw new Error("Unerwartete Antwort von ESPN");
}

// Tage mit Spielen, z. B. "2026-11-06T08:00Z" → "2026-11-06".
export function leseKalender(json: unknown): string[] {
  const kalender = (json as { leagues?: { calendar?: unknown }[] })
    ?.leagues?.[0]?.calendar;
  if (!Array.isArray(kalender)) falscheForm();
  return kalender
    .filter((eintrag): eintrag is string => typeof eintrag === "string")
    .map((eintrag) => eintrag.slice(0, 10))
    .sort();
}

type EspnTeam = {
  homeAway?: string;
  score?: string;
  team?: { id?: string; shortDisplayName?: string; logo?: string };
};

type EspnDetail = {
  scoringPlay?: boolean;
  ownGoal?: boolean;
  penaltyKick?: boolean;
  clock?: { displayValue?: string };
  team?: { id?: string };
  athletesInvolved?: { shortName?: string }[];
};

type EspnPartie = {
  id?: string;
  date?: string;
  status?: { displayClock?: string; type?: { state?: string } };
  competitions?: { competitors?: EspnTeam[]; details?: EspnDetail[] }[];
};

function teamName(id: string, espnName: string): string {
  const name = TEAMNAMEN[id];
  if (name) return name;
  console.error(`Team ${id} fehlt in der Namensliste`);
  return espnName;
}

function teamStand(roh: EspnTeam | undefined, angepfiffen: boolean): TeamStand {
  const id = roh?.team?.id ?? falscheForm();
  return {
    id,
    name: teamName(id, roh?.team?.shortDisplayName ?? ""),
    logo: roh?.team?.logo ?? null,
    tore: angepfiffen ? Number(roh?.score ?? 0) : null,
  };
}

// "A. García" → "García", "90'+2'" → "90+2'". Eigentor (ET) und Elfmeter (E) bekommen einen Zusatz.
function torText(detail: EspnDetail): string {
  const name = (detail.athletesInvolved?.[0]?.shortName ?? "").replace(
    /^\S+\.\s+/,
    "",
  );
  const minute = (detail.clock?.displayValue ?? "").replace("'+", "+");
  const zusatz = detail.ownGoal ? " (ET)" : detail.penaltyKick ? " (E)" : "";
  return `${name} ${minute}${zusatz}`;
}

export function leseTag(json: unknown, jetzt: Date): Partie[] {
  const partien = (json as { events?: EspnPartie[] })?.events;
  if (!Array.isArray(partien)) falscheForm();
  return partien.map((roh) => {
    const wettkampf = roh.competitions?.[0];
    const teams = wettkampf?.competitors ?? [];
    const zustand = roh.status?.type?.state;
    const status: Partie["status"] = zustand === "post" ? "vorbei" : "vorher";
    const angepfiffen = status !== "vorher";
    return {
      id: roh.id ?? falscheForm(),
      anstoss: roh.date ?? falscheForm(),
      status,
      minute: null,
      heim: teamStand(
        teams.find((t) => t.homeAway === "home"),
        angepfiffen,
      ),
      gast: teamStand(
        teams.find((t) => t.homeAway === "away"),
        angepfiffen,
      ),
      tore: (wettkampf?.details ?? [])
        .filter((detail) => detail.scoringPlay)
        .map((detail) => ({
          text: torText(detail),
          teamId: detail.team?.id ?? "",
        })),
    };
  });
}
