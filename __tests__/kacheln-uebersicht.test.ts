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
      eintrag.partie.id,
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
  expect(ergebnis.live[0].meinTeam).toEqual(["132"]);
});
