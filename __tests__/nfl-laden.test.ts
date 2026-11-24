// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { NFL_ADRESSEN } from "@/lib/kacheln/nfl/espn";
import { ladeNfl } from "@/lib/kacheln/nfl/laden";
import summary from "@/__tests__/fixtures/nfl-summary.json";
import tabelle from "@/__tests__/fixtures/nfl-tabelle.json";
import woche from "@/__tests__/fixtures/nfl-woche.json";

const EINSTELLUNG = {
  id: "nfl",
  art: "nfl" as const,
  titel: "NFL",
  aussehen: { farbe: "#2F5BB7", kuerzel: "NFL" },
  gruppe: "Sport",
  meinTeam: ["26"],
  division: "NFC West",
  conference: "National Football Conference",
  zonen: [
    { von: 1, bis: 4, name: "Division-Sieger", farbe: "#4C8DF6" },
    { von: 5, bis: 7, name: "Wildcard", farbe: "#22B8CF" },
  ],
};

// Di 24.11. 03:00 deutscher Zeit: Woche 11, Commanders – Bengals läuft (Fixture), die Seahawks sind spielfrei.
const JETZT = new Date("2026-11-24T02:00:00Z");
const LIVE_ID = woche.events.at(-1)!.id;

// Eine kleine Woche 12: erstes Spiel Do 26.11. 02:00 deutscher Zeit, die Seahawks spielen am Sonntag.
const WOCHE_12 = {
  week: { number: 12, teamsOnBye: [] },
  events: [
    {
      id: "w12-1",
      date: "2026-11-26T01:00Z",
      status: {
        displayClock: "0:00",
        period: 0,
        type: { name: "STATUS_SCHEDULED", state: "pre" },
      },
      competitions: [
        {
          competitors: [
            {
              homeAway: "home",
              score: "0",
              team: { id: "8", shortDisplayName: "Lions" },
            },
            {
              homeAway: "away",
              score: "0",
              team: { id: "9", shortDisplayName: "Packers" },
            },
          ],
        },
      ],
    },
  ],
};

const ANTWORTEN: Record<string, unknown> = {
  [NFL_ADRESSEN.kalender]: woche,
  [NFL_ADRESSEN.woche(11)]: woche,
  [NFL_ADRESSEN.woche(12)]: WOCHE_12,
  [NFL_ADRESSEN.tabelle]: tabelle,
  [NFL_ADRESSEN.plays(LIVE_ID)]: summary,
};

const fetchMock = vi.fn();

function antworten(abweichend: Record<string, unknown | number> = {}) {
  const alle = { ...ANTWORTEN, ...abweichend };
  fetchMock.mockImplementation(async (url: string) => {
    const antwort = alle[url];
    if (antwort === undefined) throw new Error(`Unerwartete Adresse ${url}`);
    if (typeof antwort === "number")
      return new Response("", { status: antwort });
    return Response.json(antwort);
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  antworten();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const optionen = (url: string) =>
  fetchMock.mock.calls
    .filter(([aufgerufen]) => aufgerufen === url)
    .map(([, o]) => o);

test("baut Woche, Partien mit Plays, spielfreie Teams und Tabellen", async () => {
  const daten = await ladeNfl(EINSTELLUNG, JETZT);

  expect(daten.art).toBe("nfl");
  expect(daten.titel).toBe("Woche 11");
  expect(daten.tage).toEqual([
    "2026-11-20",
    "2026-11-22",
    "2026-11-23",
    "2026-11-24",
  ]);
  expect(daten.partien).toHaveLength(13);
  const live = daten.partien.find((partie) => partie.id === LIVE_ID)!;
  expect(live.tore).toHaveLength(10);
  expect(
    daten.partien
      .filter((partie) => partie.id !== LIVE_ID)
      .every((partie) => partie.tore.length === 0),
  ).toBe(true);
  expect(daten.spielfrei.map((team) => team.id)).toContain("26");
  expect(daten.division?.map((zeile) => zeile.name)).toEqual([
    "49ers",
    "Seahawks",
    "Rams",
    "Cardinals",
  ]);
  expect(daten.conference?.map((zeile) => zeile?.seed ?? null)).toEqual([
    1,
    null,
    6,
    7,
    8,
    9,
    10,
  ]);
  expect(daten.meinTeam).toEqual(["26"]);
  expect(daten.zonen).toEqual(EINSTELLUNG.zonen);
});

test("Plays nur für laufende Partien und Mein Team, nicht für andere beendete", async () => {
  await ladeNfl(EINSTELLUNG, JETZT);
  const playsAbrufe = fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/summary?"),
  );
  expect(playsAbrufe.map(([url]) => url)).toEqual([
    NFL_ADRESSEN.plays(LIVE_ID),
  ]);
});

test("ein gescheiterter Abruf der Plays lässt nur diese Partie ohne Plays", async () => {
  antworten({ [NFL_ADRESSEN.plays(LIVE_ID)]: 500 });
  const daten = await ladeNfl(EINSTELLUNG, JETZT);
  expect(daten.partien.find((partie) => partie.id === LIVE_ID)?.tore).toEqual(
    [],
  );
  expect(daten.partien).toHaveLength(13);
});

test("Tabelle nicht erreichbar: Partien da, Tabellen null", async () => {
  antworten({ [NFL_ADRESSEN.tabelle]: 500 });
  const daten = await ladeNfl(EINSTELLUNG, JETZT);
  expect(daten.division).toBeNull();
  expect(daten.conference).toBeNull();
  expect(daten.partien).toHaveLength(13);
});

test("läuft eine Partie, kommen Woche, Tabelle und Plays frisch, der Kalender aus dem Speicher", async () => {
  await ladeNfl(EINSTELLUNG, JETZT);
  expect(optionen(NFL_ADRESSEN.kalender)[0].next).toEqual({
    revalidate: 86400,
    tags: ["nfl"],
  });
  expect(optionen(NFL_ADRESSEN.woche(11)).at(-1).cache).toBe("no-store");
  expect(optionen(NFL_ADRESSEN.tabelle).at(-1).cache).toBe("no-store");
  expect(optionen(NFL_ADRESSEN.plays(LIVE_ID))[0].cache).toBe("no-store");
});

test("am Mittwoch nennt der Kalender schon Woche 12, es gilt aber noch Woche 11", async () => {
  const daten = await ladeNfl(EINSTELLUNG, new Date("2026-11-25T11:00:00Z"));
  expect(optionen(NFL_ADRESSEN.woche(12))).toHaveLength(1);
  expect(daten.titel).toBe("Woche 11");
});

test("ab Donnerstag gilt Woche 12", async () => {
  const daten = await ladeNfl(EINSTELLUNG, new Date("2026-11-25T23:30:00Z"));
  expect(daten.titel).toBe("Woche 12");
  expect(daten.partien.map((partie) => partie.id)).toEqual(["w12-1"]);
});
