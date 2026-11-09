// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ladeBundesliga } from "@/lib/kacheln/bundesliga/laden";

const EINSTELLUNG = {
  id: "bundesliga",
  art: "bundesliga" as const,
  titel: "Bundesliga",
  meinTeam: ["132"],
};
// So 8.11. 17:45 deutscher Zeit
const JETZT = new Date("2026-11-08T16:45:00Z");

const KALENDER =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard";
const TABELLE =
  "https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings";
const SPIELPLAN = "https://api.openligadb.de/getmatchdata/bl1/2026";

function team(id: string, homeAway: string, score = "0") {
  return { homeAway, score, team: { id, shortDisplayName: id, logo: null } };
}

function tag(state: "pre" | "in" | "post", date: string) {
  return {
    events: [
      {
        id: date,
        date,
        status: { displayClock: "56'", type: { state } },
        competitions: [
          {
            competitors: [team("2950", "home"), team("132", "away")],
            details: [],
          },
        ],
      },
    ],
  };
}

const ANTWORTEN: Record<string, unknown> = {
  [KALENDER]: {
    leagues: [
      {
        calendar: [
          "2026-11-07T08:00Z",
          "2026-11-08T08:00Z",
          "2026-11-20T08:00Z",
        ],
      },
    ],
  },
  [`${KALENDER}?dates=20261107`]: tag("post", "2026-11-07T14:30Z"),
  [`${KALENDER}?dates=20261108`]: tag("post", "2026-11-08T14:30Z"),
  [TABELLE]: {
    children: [
      {
        standings: {
          entries: [
            {
              team: { id: "132", shortDisplayName: "Bayern", logos: [] },
              stats: [
                { name: "rank", value: 1 },
                { name: "gamesPlayed", value: 9 },
                { name: "pointDifferential", value: 20 },
                { name: "points", value: 21 },
              ],
            },
          ],
        },
      },
    ],
  },
  [SPIELPLAN]: [
    { matchDateTime: "2026-11-07T15:30:00", group: { groupOrderID: 9 } },
    { matchDateTime: "2026-11-08T15:30:00", group: { groupOrderID: 9 } },
  ],
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
  antworten();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("baut die Daten aus Kalender, Tagen, Tabelle und Spielplan", async () => {
  const daten = await ladeBundesliga(EINSTELLUNG, JETZT);

  expect(daten.art).toBe("bundesliga");
  expect(daten.titel).toBe("9. Spieltag");
  expect(daten.tage).toEqual(["2026-11-07", "2026-11-08"]);
  expect(daten.partien.map((p) => p.id)).toEqual([
    "2026-11-07T14:30Z",
    "2026-11-08T14:30Z",
  ]);
  expect(daten.tabelle.map((z) => z?.name)).toEqual(["Bayern"]);
  expect(daten.meinTeam).toEqual(["132"]);
});

test("setzt Speicher, Etikett und Zeitlimit", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");
  await ladeBundesliga(EINSTELLUNG, JETZT);

  const optionen = (url: string) =>
    fetchMock.mock.calls.find(([aufgerufen]) => aufgerufen === url)?.[1];
  expect(optionen(KALENDER).next).toEqual({
    revalidate: 86400,
    tags: ["bundesliga"],
  });
  expect(optionen(SPIELPLAN).next).toEqual({
    revalidate: 86400,
    tags: ["bundesliga"],
  });
  expect(optionen(`${KALENDER}?dates=20261108`).next).toEqual({
    revalidate: 900,
    tags: ["bundesliga"],
  });
  expect(optionen(TABELLE).next).toEqual({
    revalidate: 900,
    tags: ["bundesliga"],
  });
  expect(optionen(TABELLE).headers["User-Agent"]).toBe("Tages-Dashboard");
  expect(zeitlimit).toHaveBeenCalledTimes(5);
  expect(zeitlimit).toHaveBeenCalledWith(5000);
});

test("ruft einen Tag mit laufender Partie mit 60 nach", async () => {
  antworten({ [`${KALENDER}?dates=20261108`]: tag("in", "2026-11-08T16:30Z") });
  const daten = await ladeBundesliga(EINSTELLUNG, JETZT);

  const revalidate = (url: string) =>
    fetchMock.mock.calls
      .filter(([aufgerufen]) => aufgerufen === url)
      .map(([, optionen]) => optionen.next.revalidate);
  expect(revalidate(`${KALENDER}?dates=20261108`)).toEqual([900, 60]);
  expect(revalidate(TABELLE)).toEqual([900, 60]);
  expect(revalidate(`${KALENDER}?dates=20261107`)).toEqual([900]);
  expect(daten.partien.some((p) => p.status === "laeuft")).toBe(true);
});

test("ohne laufende Partie kein zweiter Abruf", async () => {
  await ladeBundesliga(EINSTELLUNG, JETZT);
  expect(fetchMock).toHaveBeenCalledTimes(5);
});
