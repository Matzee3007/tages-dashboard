// @vitest-environment node
import { expect, test } from "vitest";
import {
  leseScoringPlays,
  leseTabellen,
  leseWoche,
  leseWochen,
} from "@/lib/kacheln/nfl/espn";
import summary from "@/__tests__/fixtures/nfl-summary.json";
import tabelle from "@/__tests__/fixtures/nfl-tabelle.json";
import woche from "@/__tests__/fixtures/nfl-woche.json";

// Gekürzte echte Antworten von ESPN vom 2026-11-24 (Woche 11). Die letzte Partie (Commanders – Bengals) ist auf
// „läuft, 3. Viertel, 8:42“ gesetzt.

const JETZT = new Date("2026-11-24T02:00:00Z");

test("leseWochen: die 18 Wochen der Regular Season mit Beginn und Ende", () => {
  const wochen = leseWochen(woche);
  expect(wochen).toHaveLength(18);
  expect(wochen[11]).toEqual({
    nummer: 12,
    start: "2026-11-25T08:00Z",
    ende: "2026-12-02T07:59Z",
  });
});

test("leseWoche: Partien mit Status, Viertel und Uhr, spielfreie Teams", () => {
  const { partien, spielfrei } = leseWoche(woche, JETZT);
  expect(partien).toHaveLength(13);
  expect(spielfrei.map((team) => team.id)).toContain("26");
  expect(spielfrei.find((team) => team.id === "26")?.name).toBe("Seahawks");

  const live = partien.at(-1)!;
  expect(live).toMatchObject({
    status: "laeuft",
    minute: "Q3 8:42",
    heim: { id: "28", name: "Commanders", tore: 22 },
    gast: { id: "4", name: "Bengals", tore: 20 },
    tore: [],
  });
  expect(partien[0]).toMatchObject({
    status: "vorbei",
    minute: null,
    heim: { name: "Texans", tore: 26 },
  });
});

test("leseTabellen: Division nach Seed und die ganze Conference", () => {
  const { division, conference } = leseTabellen(
    tabelle,
    "NFC West",
    "National Football Conference",
  );
  expect(division.map((zeile) => [zeile.name, zeile.seed])).toEqual([
    ["49ers", 1],
    ["Seahawks", 8],
    ["Rams", 9],
    ["Cardinals", 16],
  ]);
  expect(division[1]).toMatchObject({
    id: "26",
    siege: 6,
    niederlagen: 4,
    unentschieden: 0,
  });
  expect(conference).toHaveLength(16);
  expect(conference.map((zeile) => zeile.seed)).toEqual(
    Array.from({ length: 16 }, (_, i) => i + 1),
  );
});

test("leseTabellen: unbekannte Division wirft", () => {
  expect(() =>
    leseTabellen(tabelle, "NFC Mitte", "National Football Conference"),
  ).toThrow("Unerwartete Antwort von ESPN");
});

test("leseScoringPlays: Viertel, Uhr, Kürzel und Text ohne Vornamen, Seite nach Team", () => {
  const plays = leseScoringPlays(summary, "28", "4");
  expect(plays[0]).toEqual({
    text: "Q2 6:17 FG McPherson 38 Yd",
    seite: "gast",
  });
  expect(plays[1]).toEqual({
    text: "Q2 1:55 TD Higgins 31 Yd pass",
    seite: "gast",
  });
  expect(plays[2]).toEqual({
    text: "Q2 0:12 TD Croskey-Merritt 1 Yd Rush",
    seite: "heim",
  });
  expect(plays).toHaveLength(10);
});

test("falsche Form wirft", () => {
  expect(() => leseWoche({}, JETZT)).toThrow("Unerwartete Antwort von ESPN");
  expect(() => leseScoringPlays({}, "1", "2")).toThrow(
    "Unerwartete Antwort von ESPN",
  );
});

test("Kürzel der Plays nach Art: TD, FG, Safety, 2Pt", () => {
  const play = (text: string, abbreviation: string) => ({
    type: { text, abbreviation },
    text: "Max Muster 1 Yd Rush",
    period: { number: 4 },
    clock: { displayValue: "2:00" },
    team: { id: "1" },
  });
  const plays = leseScoringPlays(
    {
      scoringPlays: [
        play("Rushing Touchdown", "TD"),
        play("Field Goal Good", "FG"),
        play("Safety", "SF"),
        play("Two-Point Conversion", "2PT"),
        play("Fumble Return Touchdown", "FRTD"),
      ],
    },
    "1",
    "2",
  );
  expect(plays.map((p) => p.text.split(" ")[2])).toEqual([
    "TD",
    "FG",
    "Safety",
    "2Pt",
    "TD",
  ]);
});

test("Overtime und Halbzeit", () => {
  const spiel = (status: object) => ({
    events: [
      {
        id: "1",
        date: "2026-11-22T18:00Z",
        status,
        competitions: [
          {
            competitors: [
              {
                homeAway: "home",
                score: "7",
                team: { id: "1", shortDisplayName: "A" },
              },
              {
                homeAway: "away",
                score: "7",
                team: { id: "2", shortDisplayName: "B" },
              },
            ],
          },
        ],
      },
    ],
  });
  const minute = (status: object) =>
    leseWoche(spiel(status), JETZT).partien[0].minute;
  expect(
    minute({
      period: 5,
      displayClock: "3:10",
      type: { state: "in", name: "STATUS_IN_PROGRESS" },
    }),
  ).toBe("OT 3:10");
  expect(
    minute({
      period: 2,
      displayClock: "0:00",
      type: { state: "in", name: "STATUS_HALFTIME" },
    }),
  ).toBe("Halbzeit");
});

test("ohne Seed steht das Team am Ende mit seed null", () => {
  const ohneSeed = structuredClone(tabelle);
  const west = ohneSeed.children[1].children.find(
    (d) => d.name === "NFC West",
  )!;
  west.standings.entries[0].stats = west.standings.entries[0].stats.filter(
    (s) => s.name !== "playoffSeed",
  );
  const { division, conference } = leseTabellen(
    ohneSeed,
    "NFC West",
    "National Football Conference",
  );
  expect(division.at(-1)?.seed).toBeNull();
  expect(conference.at(-1)?.seed).toBeNull();
});

test("Plays ohne passendes Team fallen weg, FG und Safety stehen nicht doppelt", () => {
  const plays = leseScoringPlays(
    {
      scoringPlays: [
        {
          type: { text: "Field Goal Good" },
          text: "Jason Myers 45 Yd Field Goal",
          period: { number: 4 },
          clock: { displayValue: "0:03" },
          team: { id: "1" },
        },
        {
          type: { text: "Safety" },
          text: "Team Safety",
          period: { number: 3 },
          clock: { displayValue: "5:10" },
          team: { id: "2" },
        },
        {
          type: { text: "Rushing Touchdown" },
          text: "Max Muster 1 Yd Rush",
          period: { number: 1 },
          clock: { displayValue: "9:00" },
          team: {},
        },
      ],
    },
    "1",
    "2",
  );
  expect(plays).toEqual([
    { text: "Q4 0:03 FG Myers 45 Yd", seite: "heim" },
    { text: "Q3 5:10 Safety", seite: "gast" },
  ]);
});

test("ein leerer Kalender ist eine falsche Form", () => {
  expect(() =>
    leseWochen({
      leagues: [{ calendar: [{ label: "Regular Season", entries: [] }] }],
    }),
  ).toThrow("Unerwartete Antwort von ESPN");
});
