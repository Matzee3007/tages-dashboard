// @vitest-environment node
import { expect, test } from "vitest";
import { leseKalender, leseTag } from "@/lib/kacheln/bundesliga/espn";

// Ausschnitte echter Antworten von ESPN vom 2026-11-08, gekürzt auf die gelesenen Felder.

const JETZT = new Date("2026-11-08T17:45:00Z");

function team(
  id: string,
  kurz: string,
  homeAway: "home" | "away",
  score?: string,
) {
  return {
    homeAway,
    score,
    team: {
      id,
      shortDisplayName: kurz,
      logo: `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`,
    },
  };
}

function tor(
  name: string,
  minute: string,
  teamId: string,
  zusatz: { ownGoal?: boolean; penaltyKick?: boolean } = {},
) {
  return {
    scoringPlay: true,
    ownGoal: zusatz.ownGoal ?? false,
    penaltyKick: zusatz.penaltyKick ?? false,
    clock: { displayValue: minute },
    team: { id: teamId },
    athletesInvolved: [{ shortName: name }],
  };
}

function partie(
  felder: {
    id?: string;
    date?: string;
    state?: "pre" | "in" | "post";
    displayClock?: string;
    heim?: ReturnType<typeof team>;
    gast?: ReturnType<typeof team>;
    details?: unknown[];
  } = {},
) {
  return {
    id: felder.id ?? "1",
    date: felder.date ?? "2026-11-08T14:30Z",
    status: {
      displayClock: felder.displayClock ?? "90'+6'",
      type: { state: felder.state ?? "post" },
    },
    competitions: [
      {
        competitors: [
          felder.heim ?? team("122", "Cologne", "home", "1"),
          felder.gast ?? team("131", "Leverkusen", "away", "2"),
        ],
        details: felder.details ?? [],
      },
    ],
  };
}

test("liest die Tage des Kalenders", () => {
  const json = {
    leagues: [
      {
        calendar: [
          "2026-11-06T08:00Z",
          "2026-11-07T08:00Z",
          "2026-11-08T08:00Z",
          "2026-11-20T08:00Z",
        ],
      },
    ],
  };
  expect(leseKalender(json)).toEqual([
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
    "2026-11-20",
  ]);
});

test("liest eine beendete Partie mit Toren", () => {
  const json = {
    events: [
      partie({
        details: [
          tor("A. García", "7'", "131"),
          { scoringPlay: false, clock: { displayValue: "30'" } },
          tor("P. Schick", "85'", "131"),
          tor("S. El Mala", "90'+2'", "122"),
        ],
      }),
    ],
  };
  expect(leseTag(json, JETZT)).toEqual([
    {
      id: "1",
      anstoss: "2026-11-08T14:30Z",
      status: "vorbei",
      minute: null,
      heim: {
        id: "122",
        name: "Köln",
        logo: "https://a.espncdn.com/i/teamlogos/soccer/500/122.png",
        tore: 1,
      },
      gast: {
        id: "131",
        name: "Leverkusen",
        logo: "https://a.espncdn.com/i/teamlogos/soccer/500/131.png",
        tore: 2,
      },
      tore: [
        { text: "García 7'", teamId: "131" },
        { text: "Schick 85'", teamId: "131" },
        { text: "El Mala 90+2'", teamId: "122" },
      ],
    },
  ]);
});
