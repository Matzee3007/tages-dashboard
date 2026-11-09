// @vitest-environment node
import { expect, test, vi } from "vitest";
import {
  leseKalender,
  leseTabelle,
  leseTag,
} from "@/lib/kacheln/bundesliga/espn";

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

test("Eigentor und Elfmeter bekommen einen Zusatz", () => {
  const json = {
    events: [
      partie({
        details: [
          tor("T. Müller", "12'", "131", { ownGoal: true }),
          tor("H. Kane", "30'", "122", { penaltyKick: true }),
        ],
      }),
    ],
  };
  expect(leseTag(json, JETZT)[0].tore.map((t) => t.text)).toEqual([
    "Müller 12' (ET)",
    "Kane 30' (E)",
  ]);
});

test("liest eine laufende Partie", () => {
  const json = {
    events: [
      partie({
        date: "2026-11-08T16:30Z",
        state: "in",
        displayClock: "56'",
        heim: team("126", "Freiburg", "home", "0"),
        gast: team("598", "Union Berlin", "away", "0"),
      }),
    ],
  };
  const [laufend] = leseTag(json, JETZT);
  expect(laufend.status).toBe("laeuft");
  expect(laufend.minute).toBe("56'");
  expect(laufend.heim.tore).toBe(0);
  expect(laufend.gast.name).toBe("Union");
});

test("pre nach Anstoß zählt als laufend", () => {
  const json = {
    events: [partie({ date: "2026-11-08T17:30Z", state: "pre" })],
  };
  const [partieNachAnstoss] = leseTag(json, JETZT);
  expect(partieNachAnstoss.status).toBe("laeuft");
  expect(partieNachAnstoss.minute).toBeNull();
});

test("offene Partie hat keine Tore", () => {
  const json = {
    events: [partie({ date: "2026-11-08T18:30Z", state: "pre" })],
  };
  const [offen] = leseTag(json, JETZT);
  expect(offen.status).toBe("vorher");
  expect(offen.heim.tore).toBeNull();
  expect(offen.gast.tore).toBeNull();
});

test("fehlende id nimmt den Namen von ESPN und meldet sie", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const json = {
    events: [partie({ gast: team("999", "Neustadt", "away", "0") })],
  };
  expect(leseTag(json, JETZT)[0].gast.name).toBe("Neustadt");
  expect(log).toHaveBeenCalledWith("Team 999 fehlt in der Namensliste");
  log.mockRestore();
});

test("wirft bei falscher Form", () => {
  expect(() => leseTag({}, JETZT)).toThrow("Unerwartete Antwort von ESPN");
  expect(() => leseKalender({})).toThrow("Unerwartete Antwort von ESPN");
});

function tabellenEintrag(
  id: string,
  kurz: string,
  werte: {
    rank: number;
    gamesPlayed: number;
    pointDifferential: number;
    points: number;
  },
) {
  return {
    team: {
      id,
      shortDisplayName: kurz,
      logos: [
        { href: `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png` },
      ],
    },
    stats: Object.entries(werte).map(([name, value]) => ({ name, value })),
  };
}

test("liest die Tabelle", () => {
  const json = {
    children: [
      {
        standings: {
          entries: [
            tabellenEintrag("124", "Dortmund", {
              rank: 2,
              gamesPlayed: 9,
              pointDifferential: 9,
              points: 21,
            }),
            tabellenEintrag("132", "Bayern", {
              rank: 1,
              gamesPlayed: 9,
              pointDifferential: 20,
              points: 21,
            }),
          ],
        },
      },
    ],
  };
  expect(leseTabelle(json)).toEqual([
    {
      platz: 1,
      id: "132",
      name: "Bayern",
      logo: "https://a.espncdn.com/i/teamlogos/soccer/500/132.png",
      spiele: 9,
      differenz: 20,
      punkte: 21,
    },
    {
      platz: 2,
      id: "124",
      name: "Dortmund",
      logo: "https://a.espncdn.com/i/teamlogos/soccer/500/124.png",
      spiele: 9,
      differenz: 9,
      punkte: 21,
    },
  ]);
  expect(() => leseTabelle({})).toThrow("Unerwartete Antwort von ESPN");
});
