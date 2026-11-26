import { expect, test } from "vitest";
import type { FussballDaten, Partie } from "@/lib/kacheln/fussball/typen";
import type { KachelAnzeige } from "@/lib/kacheln/typen";
import { abzeichen, uebersicht } from "@/lib/kacheln/uebersicht";

const JETZT = new Date("2026-11-22T17:05:00Z");

const partie = (
  id: string,
  status: Partie["status"],
  heim: string,
  gast: string,
): Partie => ({
  id,
  anstoss: "2026-11-22T16:30:00Z",
  status,
  minute: status === "laeuft" ? "35'" : null,
  heim: { id: heim, name: `Team ${heim}`, logo: null, tore: 1 },
  gast: { id: gast, name: `Team ${gast}`, logo: null, tore: 0 },
  tore: [],
});

const fussball = (
  id: string,
  kuerzel: string,
  partien: Partie[],
  meinTeam: string[],
): KachelAnzeige => {
  const daten: FussballDaten = {
    art: "fussball",
    titel: "12. Spieltag",
    tage: ["2026-11-22"],
    partien,
    tabelle: [
      {
        platz: 1,
        id: "132",
        name: "Bayern",
        logo: null,
        spiele: 11,
        differenz: 30,
        punkte: 31,
      },
    ],
    meinTeam,
    zonen: [],
  };
  return {
    id,
    titel: id,
    aussehen: { farbe: "#E3343F", kuerzel },
    gruppe: "Sport",
    daten,
    stand: JETZT.toISOString(),
    fehler: false,
  };
};

const kiNews: KachelAnzeige = {
  id: "ki-news",
  titel: "KI-News",
  aussehen: { farbe: "#8E99A8" },
  daten: {
    art: "ki-news",
    absender: [
      {
        name: "Anthropic",
        aussehen: { farbe: "#D97757" },
        meldungen: [
          { titel: "Neu", link: "https://a", zeit: "2026-11-22T15:00:00Z" },
        ],
        letzteMeldung: "2026-11-22T15:00:00Z",
        erreichbar: true,
      },
    ],
  },
  stand: JETZT.toISOString(),
  fehler: false,
};

test("Live aus allen Wettbewerben mit Herkunft und Reiter", () => {
  const ergebnis = uebersicht(
    [
      fussball(
        "bundesliga",
        "BL",
        [partie("bl-1", "laeuft", "132", "28")],
        ["132"],
      ),
      fussball(
        "premier-league",
        "PL",
        [partie("pl-1", "laeuft", "337", "349")],
        ["359"],
      ),
    ],
    JETZT,
  );
  expect(
    ergebnis.live.map((eintrag) => [
      eintrag.kachelId,
      eintrag.reiter,
      eintrag.aussehen.kuerzel,
      "partie" in eintrag ? eintrag.partie.id : null,
    ]),
  ).toEqual([
    ["bundesliga", "Sport", "BL", "bl-1"],
    ["premier-league", "Sport", "PL", "pl-1"],
  ]);
});

test("dasselbe Team aus mehreren Wettbewerben steht einmal, mit je einem Eintrag pro Wettbewerb", () => {
  const ergebnis = uebersicht(
    [
      fussball(
        "bundesliga",
        "BL",
        [partie("bl-1", "laeuft", "132", "28")],
        ["132"],
      ),
      fussball("premier-league", "PL", [], ["359"]),
      fussball(
        "champions-league",
        "CL",
        [partie("cl-1", "vorher", "132", "359")],
        ["132", "359"],
      ),
    ],
    JETZT,
  );
  expect(
    ergebnis.meinTeam.map((team) => [
      team.id,
      team.wettbewerbe.map((w) => w.kachelId),
    ]),
  ).toEqual([
    ["132", ["bundesliga", "champions-league"]],
    ["359", ["premier-league", "champions-league"]],
  ]);
  expect(ergebnis.meinTeam[0]).toMatchObject({ name: "Team 132" });
  expect(ergebnis.meinTeam[0].wettbewerbe[0].platz?.text).toBe(
    "Platz 1 · 31 Pkt",
  );
});

test("neue KI-News mit Reiter, Kacheln ohne Daten werden übersprungen", () => {
  const ohneDaten: KachelAnzeige = {
    ...fussball("bundesliga", "BL", [], []),
    daten: null,
    fehler: true,
  };
  const ergebnis = uebersicht([ohneDaten, kiNews], JETZT);
  expect(ergebnis.live).toEqual([]);
  expect(ergebnis.meinTeam).toEqual([]);
  expect(ergebnis.newsReiter).toBe("KI-News");
  expect(uebersicht([ohneDaten], JETZT).newsReiter).toBeNull();
  expect(ergebnis.neu).toEqual([
    expect.objectContaining({
      absender: "Anthropic",
      reiter: "KI-News",
      meldung: expect.objectContaining({ titel: "Neu" }),
    }),
  ]);
});

test("Abzeichen: Punkt am Reiter einer laufenden Partie, Zahl der neuen Meldungen", () => {
  const ergebnis = uebersicht(
    [
      fussball(
        "bundesliga",
        "BL",
        [partie("bl-1", "laeuft", "132", "28")],
        ["132"],
      ),
      kiNews,
    ],
    JETZT,
  );
  expect(abzeichen(ergebnis)).toEqual({ Sport: "live", "KI-News": 1 });
  expect(abzeichen(uebersicht([], JETZT))).toEqual({});
});

test("Kacheln im Fehler stehen mit Herkunft in der Liste fehler", () => {
  const ohneDaten: KachelAnzeige = {
    ...fussball("bundesliga", "BL", [], []),
    daten: null,
    fehler: true,
  };
  const alteDaten: KachelAnzeige = { ...kiNews, fehler: true };
  const ergebnis = uebersicht([ohneDaten, alteDaten], JETZT);
  expect(ergebnis.fehler.map((f) => [f.kachelId, f.reiter])).toEqual([
    ["bundesliga", "Sport"],
    ["ki-news", "KI-News"],
  ]);
  expect(uebersicht([kiNews], JETZT).fehler).toEqual([]);
});

test("ein Team, das zuerst nur als Kennung bekannt ist, bekommt den Namen aus einem späteren Wettbewerb", () => {
  const ohneName = fussball("bundesliga", "BL", [], ["359"]);
  const mitName = fussball(
    "champions-league",
    "CL",
    [partie("cl-1", "vorher", "359", "132")],
    ["359"],
  );
  const team = uebersicht([ohneName, mitName], JETZT).meinTeam[0];
  expect(team).toMatchObject({ id: "359", name: "Team 359" });
});

test("Live-Einträge tragen Mein Team ihrer Kachel", () => {
  const ergebnis = uebersicht(
    [
      fussball(
        "bundesliga",
        "BL",
        [partie("bl-1", "laeuft", "132", "28")],
        ["132"],
      ),
    ],
    JETZT,
  );
  expect("meinTeam" in ergebnis.live[0] && ergebnis.live[0].meinTeam).toEqual([
    "132",
  ]);
});

test("eine laufende NFL-Partie steht in Jetzt live, die Seahawks unter Mein Team", () => {
  const nfl: KachelAnzeige = {
    id: "nfl",
    titel: "NFL",
    aussehen: { farbe: "#2F5BB7", kuerzel: "NFL" },
    gruppe: "Sport",
    daten: {
      art: "nfl",
      titel: "Woche 12",
      tage: [],
      partien: [partie("nfl-1", "laeuft", "26", "14")],
      spielfrei: [],
      divisionName: "NFC West",
      division: null,
      conference: null,
      meinTeam: ["26"],
      zonen: [],
    },
    stand: JETZT.toISOString(),
    fehler: false,
  };
  const ergebnis = uebersicht([nfl], JETZT);
  expect(
    ergebnis.live.map((e) => [
      e.kachelId,
      e.reiter,
      "partie" in e ? e.partie.id : null,
    ]),
  ).toEqual([["nfl", "Sport", "nfl-1"]]);
  expect("meinTeam" in ergebnis.live[0] && ergebnis.live[0].meinTeam).toEqual([
    "26",
  ]);
  expect(
    ergebnis.meinTeam.map((t) => [t.id, t.wettbewerbe[0].kachelId]),
  ).toEqual([["26", "nfl"]]);
});

test("Mein Team aus NFL und Fußball mit gleicher Kennung bleibt getrennt", () => {
  const nfl: KachelAnzeige = {
    id: "nfl",
    titel: "NFL",
    aussehen: { farbe: "#2F5BB7", kuerzel: "NFL" },
    gruppe: "Sport",
    daten: {
      art: "nfl",
      titel: "Woche 12",
      tage: [],
      partien: [partie("nfl-1", "vorher", "132", "14")],
      spielfrei: [],
      divisionName: "NFC West",
      division: null,
      conference: null,
      meinTeam: ["132"],
      zonen: [],
    },
    stand: JETZT.toISOString(),
    fehler: false,
  };
  const ergebnis = uebersicht(
    [
      fussball(
        "bundesliga",
        "BL",
        [partie("bl-1", "laeuft", "132", "28")],
        ["132"],
      ),
      nfl,
    ],
    JETZT,
  );
  expect(
    ergebnis.meinTeam.map((t) => t.wettbewerbe.map((w) => w.kachelId)),
  ).toEqual([["bundesliga"], ["nfl"]]);
});

test("eine laufende Session der Formel 1 steht in Jetzt live, mit Abzeichen am Reiter Sport", () => {
  const f1: KachelAnzeige = {
    id: "formel-1",
    titel: "Formel 1",
    aussehen: { farbe: "#0E8F82", kuerzel: "F1" },
    gruppe: "Sport",
    daten: {
      art: "formel-1",
      rennen: {
        saison: 2026,
        runde: 22,
        name: "Großer Preis von Katar",
        ort: "Lusail",
        sessions: [
          {
            art: "rennen",
            name: "Rennen",
            start: "2026-11-29T16:00:00Z",
            status: "laeuft",
          },
        ],
      },
      letzteRunde: 23,
      winterpause: false,
      ergebnis: null,
      fahrer: null,
      teams: null,
      wertungNachRunde: null,
      saisonstart: null,
    },
    stand: JETZT.toISOString(),
    fehler: false,
  };
  const ergebnis = uebersicht([f1], JETZT);
  expect(ergebnis.live).toEqual([
    expect.objectContaining({
      kachelId: "formel-1",
      reiter: "Sport",
      session: "Rennen",
      rennen: "Großer Preis von Katar",
    }),
  ]);
  expect(abzeichen(ergebnis)).toEqual({ Sport: "live" });
});
