// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { KACHELN, type FussballEinstellung } from "@/lib/einstellungen";
import { ladeDashboard } from "@/lib/kacheln/laden";
import { ladeFussball } from "@/lib/kacheln/fussball/laden";

const EINSTELLUNG: FussballEinstellung = {
  id: "premier-league",
  art: "fussball",
  aussehen: { farbe: "#8E99A8" },
  titel: "Premier League",
  espn: "eng.1",
  kalender: { art: "espn" },
  spielplan: { art: "football-data", wettbewerb: "PL" },
  tabelle: { art: "football-data", wettbewerb: "PL" },
  teams: [
    { espn: "359", footballData: 57, name: "Arsenal" },
    { espn: "367", footballData: 73, name: "Tottenham" },
  ],
  meinTeam: ["359"],
  zonen: [],
};
// Sa 21.11. 18:00 deutscher Zeit
const JETZT = new Date("2026-11-21T17:00:00Z");
const SCHLUESSEL = "geheimer-test-schluessel";

const KALENDER =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";
const SPIELPLAN = "https://api.football-data.org/v4/competitions/PL/matches";
const TABELLE = "https://api.football-data.org/v4/competitions/PL/standings";

function tag(state: "pre" | "in" | "post") {
  const team = (id: string, homeAway: string) => ({
    homeAway,
    score: "1",
    team: { id, shortDisplayName: id, logo: null },
  });
  return {
    events: [
      {
        id: "1",
        date: "2026-11-21T15:00Z",
        status: { displayClock: "56'", type: { state } },
        competitions: [
          { competitors: [team("359", "home"), team("367", "away")] },
        ],
      },
    ],
  };
}

function fdZeile(position: number, id: number) {
  return {
    position,
    team: { id, shortName: String(id), crest: null },
    playedGames: 11,
    goalDifference: 5,
    points: 30 - position,
  };
}

const ANTWORTEN: Record<string, unknown> = {
  [KALENDER]: { leagues: [{ calendar: ["2026-11-21T08:00Z"] }] },
  [`${KALENDER}?dates=20261121`]: tag("post"),
  [SPIELPLAN]: {
    matches: [
      { utcDate: "2026-11-08T14:00:00Z", matchday: 11 },
      { utcDate: "2026-11-21T15:00:00Z", matchday: 12 },
    ],
  },
  [TABELLE]: {
    standings: [{ type: "TOTAL", table: [fdZeile(1, 57), fdZeile(2, 73)] }],
  },
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

const optionen = (url: string) =>
  fetchMock.mock.calls.find(([aufgerufen]) => aufgerufen === url)?.[1];
const abrufe = (url: string) =>
  fetchMock.mock.calls.filter(([aufgerufen]) => aufgerufen === url).length;

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("FOOTBALL_DATA_API_KEY", SCHLUESSEL);
  antworten();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

test("Premier League: Partien von ESPN, Nummer und Tabelle von football-data.org", async () => {
  const daten = await ladeFussball(EINSTELLUNG, JETZT);

  expect(daten.titel).toBe("12. Spieltag");
  expect(daten.partien.map((p) => p.heim.name)).toEqual(["Arsenal"]);
  expect(daten.tabelle?.map((z) => z && [z.id, z.name])).toEqual([
    ["359", "Arsenal"],
    ["367", "Tottenham"],
  ]);
});

test("football-data.org bekommt den Schlüssel im Header, der Spielplan keinen Etikett", async () => {
  await ladeFussball(EINSTELLUNG, JETZT);

  expect(optionen(SPIELPLAN).headers["X-Auth-Token"]).toBe(SCHLUESSEL);
  expect(optionen(SPIELPLAN).next).toEqual({ revalidate: 86400 });
  expect(optionen(TABELLE).headers["X-Auth-Token"]).toBe(SCHLUESSEL);
  expect(optionen(TABELLE).next).toEqual({
    revalidate: 900,
    tags: ["premier-league"],
  });
});

test("bei laufender Partie wird die Tabelle von football-data.org nicht frisch nachgeholt", async () => {
  antworten({ [`${KALENDER}?dates=20261121`]: tag("in") });
  await ladeFussball(EINSTELLUNG, JETZT);

  expect(abrufe(TABELLE)).toBe(1);
});

test("antwortet football-data.org mit 429, laufen die Partien ohne Nummer und Tabelle weiter", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  antworten({ [SPIELPLAN]: 429, [TABELLE]: 429 });
  const daten = await ladeFussball(EINSTELLUNG, JETZT);

  expect(daten.partien).toHaveLength(1);
  expect(daten.titel).toBeNull();
  expect(daten.tabelle).toBeNull();
});

test("ohne Schlüssel kein Abruf bei football-data.org", async () => {
  const fehler = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("FOOTBALL_DATA_API_KEY", "");
  const daten = await ladeFussball(EINSTELLUNG, JETZT);

  expect(abrufe(SPIELPLAN) + abrufe(TABELLE)).toBe(0);
  expect(daten.titel).toBeNull();
  expect(daten.tabelle).toBeNull();
  expect(String(fehler.mock.calls[0][1])).toContain(
    "FOOTBALL_DATA_API_KEY fehlt",
  );
});

test("der Schlüssel steht nie in der Antwort an den Browser", async () => {
  clAntworten();
  const antwort = await ladeDashboard([EINSTELLUNG, CL], JETZT);

  expect(antwort.kacheln.map((k) => k.status)).toEqual(["ok", "ok"]);
  expect(JSON.stringify(antwort)).not.toContain(SCHLUESSEL);
});

test("Reihenfolge Bundesliga, Premier League, Champions League, KI-News mit Mein Team", () => {
  expect(KACHELN.map((kachel) => kachel.id)).toEqual([
    "bundesliga",
    "premier-league",
    "champions-league",
    "ki-news",
  ]);
  const premierLeague = KACHELN[1] as FussballEinstellung;
  expect(premierLeague.meinTeam).toEqual(["359"]);
  const championsLeague = KACHELN[2] as FussballEinstellung;
  expect(championsLeague.meinTeam).toEqual(["132", "359"]);
  expect(championsLeague.kalender).toEqual({ art: "spielplan" });
  expect(premierLeague.teams).toHaveLength(20);
  expect(premierLeague.teams).toContainEqual({
    espn: "359",
    footballData: 57,
    name: "Arsenal",
  });
});

const CL: FussballEinstellung = {
  id: "champions-league",
  art: "fussball",
  aussehen: { farbe: "#8E99A8" },
  titel: "Champions League",
  espn: "uefa.champions",
  kalender: { art: "spielplan" },
  spielplan: { art: "football-data", wettbewerb: "CL" },
  tabelle: { art: "football-data", wettbewerb: "CL" },
  teams: [
    { espn: "132", footballData: 5, name: "Bayern" },
    { espn: "359", footballData: 57, name: "Arsenal" },
  ],
  meinTeam: ["132", "359"],
  zonen: [],
};
const CL_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard";
const CL_SPIELPLAN = "https://api.football-data.org/v4/competitions/CL/matches";
const CL_TABELLE = "https://api.football-data.org/v4/competitions/CL/standings";

function clTag(...partien: [id: string, date: string][]) {
  const team = (id: string, homeAway: string) => ({
    homeAway,
    score: "0",
    team: { id, shortDisplayName: id, logo: null },
  });
  return {
    events: partien.map(([id, date]) => ({
      id,
      date,
      status: { displayClock: "0'", type: { state: "pre" } },
      competitions: [
        { competitors: [team("132", "home"), team("359", "away")] },
      ],
    })),
  };
}

function clAntworten(abweichend: Record<string, unknown | number> = {}) {
  antworten({
    [CL_SPIELPLAN]: {
      matches: [
        { utcDate: "2026-11-03T20:00:00Z", matchday: 4 },
        { utcDate: "2026-11-04T20:00:00Z", matchday: 4 },
        { utcDate: "2026-11-24T17:45:00Z", matchday: 5 },
        { utcDate: "2026-11-25T20:00:00Z", matchday: 5 },
        { utcDate: "2027-01-27T20:00:00Z", matchday: 8 },
        { utcDate: "2027-01-27T20:00:00Z", matchday: 8 },
      ],
    },
    [CL_TABELLE]: {
      standings: [{ type: "TOTAL", table: [fdZeile(1, 5), fdZeile(2, 57)] }],
    },
    [`${CL_SCOREBOARD}?dates=20261124`]: clTag(["a", "2026-11-24T17:45Z"]),
    [`${CL_SCOREBOARD}?dates=20261125`]: clTag(["b", "2026-11-25T20:00Z"]),
    [`${CL_SCOREBOARD}?dates=20270127`]: clTag(
      ["c", "2027-01-27T20:00Z"],
      ["d", "2027-01-27T20:00Z"],
    ),
    ...abweichend,
  });
}

test("Champions League: zwischen zwei Spieltagen kommt der nächste aus dem Spielplan", async () => {
  clAntworten();
  // Mo 16.11. 13:00 deutscher Zeit
  const daten = await ladeFussball(CL, new Date("2026-11-16T12:00:00Z"));

  expect(daten.tage).toEqual(["2026-11-24", "2026-11-25"]);
  expect(daten.titel).toBe("5. Spieltag");
  expect(daten.partien.map((p) => p.id).sort()).toEqual(["a", "b"]);
  expect(abrufe(CL_SCOREBOARD)).toBe(0);
});

test("Champions League: Spieltag 8 an einem Tag mit allen Partien", async () => {
  clAntworten();
  const daten = await ladeFussball(CL, new Date("2027-01-27T20:00:00Z"));

  expect(daten.tage).toEqual(["2027-01-27"]);
  expect(daten.titel).toBe("8. Spieltag");
  expect(daten.partien).toHaveLength(2);
});

test("Premier League holt die Tage weiter aus dem Kalender von ESPN", async () => {
  await ladeFussball(EINSTELLUNG, JETZT);
  expect(abrufe(KALENDER)).toBe(1);
});

test("Champions League: ohne Spielplan kommen die Tage aus dem Standardabruf von ESPN", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  clAntworten({
    [CL_SPIELPLAN]: 429,
    [CL_TABELLE]: 429,
    [CL_SCOREBOARD]: clTag(["a", "2026-11-24T17:45Z"]),
  });
  const daten = await ladeFussball(CL, new Date("2026-11-16T12:00:00Z"));

  expect(optionen(CL_SCOREBOARD).next).toEqual({
    revalidate: 900,
    tags: ["champions-league"],
  });
  expect(daten.tage).toEqual(["2026-11-24"]);
  expect(daten.titel).toBeNull();
  expect(daten.tabelle).toBeNull();
  expect(daten.partien.map((p) => p.id)).toEqual(["a"]);
});

test("Champions League: ein leerer Spielplan führt auch zum Standardabruf von ESPN", async () => {
  clAntworten({
    [CL_SPIELPLAN]: { matches: [] },
    [CL_SCOREBOARD]: clTag(["a", "2026-11-24T17:45Z"]),
  });
  const daten = await ladeFussball(CL, new Date("2026-11-16T12:00:00Z"));

  expect(daten.tage).toEqual(["2026-11-24"]);
  expect(daten.partien.map((p) => p.id)).toEqual(["a"]);
});
