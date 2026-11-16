// @vitest-environment node
import { expect, test, vi } from "vitest";
import {
  leseFdSpielplan,
  leseFdTabelle,
} from "@/lib/kacheln/fussball/football-data";

// Wie /v4/competitions/PL/matches: utcDate in UTC.
function partie(utcDate: string, matchday: number) {
  return { utcDate, matchday };
}

test("ordnet jedem Tag in deutscher Zeit die höchste Nummer seiner Partien zu", () => {
  const json = {
    matches: [
      partie("2026-11-21T15:00:00Z", 12),
      // 00:30 deutscher Zeit, also schon der Folgetag
      partie("2026-11-21T23:30:00Z", 12),
      partie("2026-11-24T20:00:00Z", 13),
      partie("2026-11-24T18:00:00Z", 9),
    ],
  };
  expect(leseFdSpielplan(json)).toEqual(
    new Map([
      ["2026-11-21", 12],
      ["2026-11-22", 12],
      ["2026-11-24", 13],
    ]),
  );
});

test("wirft bei falscher Form des Spielplans", () => {
  expect(() => leseFdSpielplan({})).toThrow(
    "Unerwartete Antwort von football-data.org",
  );
});

const ARSENAL = { espn: "359", footballData: 57, name: "Arsenal" };

function zeile(position: number, id: number, shortName: string) {
  return {
    position,
    team: {
      id,
      shortName,
      crest: `https://crests.football-data.org/${id}.png`,
    },
    playedGames: 10,
    goalDifference: 11 - position,
    points: 28 - position,
  };
}

// Wie /v4/competitions/PL/standings, nur die Gesamttabelle zählt.
function tabelle(...zeilen: ReturnType<typeof zeile>[]) {
  return { standings: [{ type: "TOTAL", table: zeilen }] };
}

test("führt eine Zeile über die Team-Liste mit der id von ESPN zusammen", () => {
  expect(leseFdTabelle(tabelle(zeile(1, 57, "Arsenal FC")), [ARSENAL])).toEqual(
    [
      {
        platz: 1,
        id: "359",
        name: "Arsenal",
        logo: "https://crests.football-data.org/57.png",
        spiele: 10,
        differenz: 10,
        punkte: 27,
      },
    ],
  );
});

test("nimmt für ein Team ohne Eintrag den Kurznamen von football-data.org und meldet es", () => {
  const fehler = vi.spyOn(console, "error").mockImplementation(() => {});
  const [ohneEintrag] = leseFdTabelle(tabelle(zeile(3, 999, "Neuling")), [
    ARSENAL,
  ]);
  expect(ohneEintrag).toMatchObject({ id: "fd-999", name: "Neuling" });
  expect(fehler).toHaveBeenCalledWith("Team 999 fehlt in der Liste");
  fehler.mockRestore();
});

test("nimmt nur die Gesamttabelle und sortiert nach Platz", () => {
  const json = {
    standings: [
      { type: "HOME", table: [zeile(1, 999, "Heimstark")] },
      {
        type: "TOTAL",
        table: [zeile(2, 999, "Zweiter"), zeile(1, 57, "Arsenal FC")],
      },
    ],
  };
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(leseFdTabelle(json, [ARSENAL]).map((z) => z.name)).toEqual([
    "Arsenal",
    "Zweiter",
  ]);
  vi.restoreAllMocks();
});

test("wirft bei falscher Form der Tabelle", () => {
  expect(() => leseFdTabelle({ standings: [] }, [ARSENAL])).toThrow(
    "Unerwartete Antwort von football-data.org",
  );
});

test("wirft, wenn einer Zeile Platz oder Punkte fehlen", () => {
  const ohnePlatz = { ...zeile(1, 57, "Arsenal FC"), position: undefined };
  const ohnePunkte = { ...zeile(1, 57, "Arsenal FC"), points: undefined };
  for (const roh of [ohnePlatz, ohnePunkte]) {
    expect(() =>
      leseFdTabelle({ standings: [{ type: "TOTAL", table: [roh] }] }, [
        ARSENAL,
      ]),
    ).toThrow("Unerwartete Antwort von football-data.org");
  }
});
