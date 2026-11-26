// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { F1_ADRESSEN } from "@/lib/kacheln/formel-1/jolpica";
import { ladeFormel1 } from "@/lib/kacheln/formel-1/laden";
import ergebnis from "@/__tests__/fixtures/f1-ergebnis.json";
import fahrer from "@/__tests__/fixtures/f1-fahrer.json";
import kalender from "@/__tests__/fixtures/f1-kalender.json";
import qualifying from "@/__tests__/fixtures/f1-qualifying.json";
import teams from "@/__tests__/fixtures/f1-teams.json";

const EINSTELLUNG = {
  id: "formel-1",
  art: "formel-1" as const,
  titel: "Formel 1",
  aussehen: { farbe: "#0E8F82", kuerzel: "F1" },
  gruppe: "Sport",
};

const LEER = { MRData: { RaceTable: { Races: [] } } };

const ANTWORTEN: Record<string, unknown> = {
  [F1_ADRESSEN.kalender]: kalender,
  [F1_ADRESSEN.qualifying(2026, 22)]: qualifying,
  [F1_ADRESSEN.ergebnis(2026, 22)]: LEER,
  [F1_ADRESSEN.qualifying(2026, 23)]: qualifying,
  [F1_ADRESSEN.ergebnis(2026, 23)]: ergebnis,
  [F1_ADRESSEN.fahrer]: fahrer,
  [F1_ADRESSEN.teams]: teams,
  [F1_ADRESSEN.saison(2027)]: LEER,
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

const aufgerufen = () => fetchMock.mock.calls.map(([url]) => url);

test("vor dem Wochenende: Katar ohne Ergebnis, mit Wertung, ohne Abruf von Ergebnissen", async () => {
  const daten = await ladeFormel1(
    EINSTELLUNG,
    new Date("2026-11-25T10:00:00Z"),
  );
  expect(daten).toMatchObject({
    art: "formel-1",
    rennen: { runde: 22, name: "Großer Preis von Katar" },
    letzteRunde: 23,
    winterpause: false,
    ergebnis: null,
    wertungNachRunde: 21,
    saisonstart: null,
  });
  expect(daten.fahrer).toHaveLength(5);
  expect(daten.teams).toHaveLength(5);
  expect(aufgerufen()).not.toContain(F1_ADRESSEN.qualifying(2026, 22));
  expect(aufgerufen()).not.toContain(F1_ADRESSEN.ergebnis(2026, 22));
});

test("nach dem Qualifying: Startaufstellung", async () => {
  const daten = await ladeFormel1(
    EINSTELLUNG,
    new Date("2026-11-28T19:30:00Z"),
  );
  expect(daten.ergebnis?.art).toBe("qualifying");
  expect(daten.ergebnis?.zeilen).toHaveLength(10);
});

test("nach dem Rennen ohne Ergebnis bei Jolpica: weiter die Startaufstellung", async () => {
  const daten = await ladeFormel1(
    EINSTELLUNG,
    new Date("2026-11-29T18:30:00Z"),
  );
  expect(daten.ergebnis?.art).toBe("qualifying");
});

test("nach dem Rennen mit Ergebnis: Rennergebnis", async () => {
  const daten = await ladeFormel1(
    EINSTELLUNG,
    new Date("2026-12-06T16:00:00Z"),
  );
  expect(daten.rennen.runde).toBe(23);
  expect(daten.ergebnis?.art).toBe("rennen");
  expect(daten.ergebnis?.zeilen[0].kuerzel).toBe("VER");
});

test("Qualifying nicht erreichbar: ohne Ergebnis, Rest da", async () => {
  antworten({ [F1_ADRESSEN.qualifying(2026, 22)]: 500 });
  const daten = await ladeFormel1(
    EINSTELLUNG,
    new Date("2026-11-28T19:30:00Z"),
  );
  expect(daten.ergebnis).toBeNull();
  expect(daten.fahrer).toHaveLength(5);
});

test("Wertung nicht erreichbar: Fahrer und Teams null", async () => {
  antworten({ [F1_ADRESSEN.fahrer]: 500, [F1_ADRESSEN.teams]: 500 });
  const daten = await ladeFormel1(
    EINSTELLUNG,
    new Date("2026-11-25T10:00:00Z"),
  );
  expect(daten.fahrer).toBeNull();
  expect(daten.teams).toBeNull();
  expect(daten.wertungNachRunde).toBeNull();
  expect(daten.rennen.runde).toBe(22);
});

test("Winterpause: ohne Kalender 2027 kein Saisonstart, mit Kalender Name und Tage", async () => {
  const winter = new Date("2026-12-09T08:00:00Z");
  const ohne = await ladeFormel1(EINSTELLUNG, winter);
  expect(ohne.winterpause).toBe(true);
  expect(ohne.saisonstart).toBeNull();

  const naechste = {
    MRData: {
      RaceTable: {
        Races: [
          {
            season: "2027",
            round: "1",
            raceName: "Australian Grand Prix",
            date: "2027-03-07",
            time: "04:00:00Z",
            Circuit: { Location: { locality: "Melbourne" } },
            FirstPractice: { date: "2027-03-05", time: "01:30:00Z" },
            Qualifying: { date: "2027-03-06", time: "05:00:00Z" },
          },
        ],
      },
    },
  };
  antworten({ [F1_ADRESSEN.saison(2027)]: naechste });
  const mit = await ladeFormel1(EINSTELLUNG, winter);
  expect(mit.saisonstart?.name).toBe("Großer Preis von Australien");
  expect(mit.saisonstart?.tage[0]).toBe("2027-03-05");
  expect(mit.saisonstart?.tage.at(-1)).toBe("2027-03-07");
});

test("alle Abrufe mit Etikett formel-1 und 2 Sekunden Zeitlimit", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");
  await ladeFormel1(EINSTELLUNG, new Date("2026-11-28T19:30:00Z"));
  expect(new Set(zeitlimit.mock.calls.map(([ms]) => ms))).toEqual(
    new Set([2000]),
  );
  for (const [, optionen] of fetchMock.mock.calls) {
    expect(optionen.next.tags).toEqual(["formel-1"]);
  }
});
