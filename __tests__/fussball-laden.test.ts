// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { TEAMS_BUNDESLIGA } from "@/lib/einstellungen";
import { ladeFussball } from "@/lib/kacheln/fussball/laden";

const EINSTELLUNG = {
  id: "bundesliga",
  art: "fussball" as const,
  titel: "Bundesliga",
  aussehen: { farbe: "#8E99A8" },
  espn: "ger.1" as const,
  kalender: { art: "espn" as const },
  spielplan: { art: "openligadb" as const, liga: "bl1" as const },
  tabelle: { art: "espn" as const },
  teams: TEAMS_BUNDESLIGA,
  meinTeam: ["132"],
  zonen: [{ von: 1, bis: 4, name: "Champions League", farbe: "#4C8DF6" }],
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
    if (antwort instanceof Response) return antwort;
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
  const daten = await ladeFussball(EINSTELLUNG, JETZT);

  expect(daten.art).toBe("fussball");
  expect(daten.titel).toBe("9. Spieltag");
  expect(daten.tage).toEqual(["2026-11-07", "2026-11-08"]);
  expect(daten.partien.map((p) => p.id)).toEqual([
    "2026-11-07T14:30Z",
    "2026-11-08T14:30Z",
  ]);
  expect(daten.tabelle?.map((z) => z?.name)).toEqual(["Bayern"]);
  expect(daten.meinTeam).toEqual(["132"]);
  expect(daten.zonen).toEqual([
    { von: 1, bis: 4, name: "Champions League", farbe: "#4C8DF6" },
  ]);
});

test("setzt Speicher, Etikett und Zeitlimit", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");
  await ladeFussball(EINSTELLUNG, JETZT);

  const optionen = (url: string) =>
    fetchMock.mock.calls.find(([aufgerufen]) => aufgerufen === url)?.[1];
  expect(optionen(KALENDER).next).toEqual({
    revalidate: 86400,
    tags: ["bundesliga"],
  });
  // Ohne Etikett: ↻ lädt den Spielplan der Saison nicht jedes Mal neu.
  expect(optionen(SPIELPLAN).next).toEqual({ revalidate: 86400 });
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

test("holt einen Tag mit laufender Partie frisch nach", async () => {
  antworten({ [`${KALENDER}?dates=20261108`]: tag("in", "2026-11-08T16:30Z") });
  const daten = await ladeFussball(EINSTELLUNG, JETZT);

  const abrufe = (url: string) =>
    fetchMock.mock.calls
      .filter(([aufgerufen]) => aufgerufen === url)
      .map(([, optionen]) => optionen.cache ?? optionen.next.revalidate);
  expect(abrufe(`${KALENDER}?dates=20261108`)).toEqual([900, "no-store"]);
  expect(abrufe(TABELLE)).toEqual([900, "no-store"]);
  expect(abrufe(`${KALENDER}?dates=20261107`)).toEqual([900]);
  expect(daten.partien.some((p) => p.status === "laeuft")).toBe(true);
});

test("ohne laufende Partie kein zweiter Abruf", async () => {
  await ladeFussball(EINSTELLUNG, JETZT);
  expect(fetchMock).toHaveBeenCalledTimes(5);
});

test("ein gescheiterter Tag lässt die Kachel scheitern", async () => {
  antworten({ [`${KALENDER}?dates=20261107`]: 500 });
  await expect(ladeFussball(EINSTELLUNG, JETZT)).rejects.toThrow("Status 500");
});

test("ohne Spielplan keine Nummer", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  antworten({ [SPIELPLAN]: 503 });

  const daten = await ladeFussball(EINSTELLUNG, JETZT);

  expect(daten.titel).toBeNull();
  expect(daten.partien).toHaveLength(2);
  expect(log).toHaveBeenCalledWith(
    "Spielplan von OpenLigaDB ließ sich nicht laden:",
    expect.any(Error),
  );
});

test("eine zu alte gespeicherte Antwort lässt die Kachel scheitern", async () => {
  // Next.js liefert bei einem Ausfall still den alten Stand, die Date-Zeile verrät ihn (ADR 0005).
  const alt = new Date(JETZT.getTime() - 61 * 60 * 1000).toUTCString();
  antworten({
    [`${KALENDER}?dates=20261108`]: Response.json(
      tag("post", "2026-11-08T14:30Z"),
      {
        headers: { Date: alt },
      },
    ),
  });
  await expect(ladeFussball(EINSTELLUNG, JETZT)).rejects.toThrow(
    "Gespeicherte Antwort",
  );
});

test("Kalender und Spielplan dürfen bis zu zwei Tage alt sein", async () => {
  const alt = new Date(JETZT.getTime() - 47 * 60 * 60 * 1000).toUTCString();
  antworten({
    [KALENDER]: Response.json(ANTWORTEN[KALENDER], { headers: { Date: alt } }),
  });
  await expect(ladeFussball(EINSTELLUNG, JETZT)).resolves.toBeDefined();
});

test("fragt ESPN nach der Liga aus der Einstellung", async () => {
  fetchMock.mockRejectedValue(new Error("nicht erreichbar"));
  await expect(
    ladeFussball({ ...EINSTELLUNG, espn: "eng.1" }, JETZT),
  ).rejects.toThrow();
  expect(fetchMock.mock.calls[0][0]).toBe(
    "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard",
  );
});

test("trennt Spieltage ohne Lücke mit dem Spielplan", async () => {
  const tage = ["2026-11-28", "2026-11-29", "2026-11-30", "2026-12-01"];
  const nummern = [12, 12, 12, 13];
  antworten({
    [KALENDER]: { leagues: [{ calendar: tage.map((t) => `${t}T08:00Z`) }] },
    ...Object.fromEntries(
      tage.map((t) => [
        `${KALENDER}?dates=${t.replaceAll("-", "")}`,
        tag("post", `${t}T14:30Z`),
      ]),
    ),
    [SPIELPLAN]: tage.map((t, i) => ({
      matchDateTime: `${t}T15:30:00`,
      group: { groupOrderID: nummern[i] },
    })),
  });

  // Mo 30.11. 20:00 deutscher Zeit
  const daten = await ladeFussball(
    EINSTELLUNG,
    new Date("2026-11-30T19:00:00Z"),
  );

  expect(daten.tage).toEqual(["2026-11-28", "2026-11-29", "2026-11-30"]);
  expect(daten.titel).toBe("12. Spieltag");
});
