// @vitest-environment node
import { expect, test } from "vitest";
import type { Partie, TabellenZeile } from "@/lib/kacheln/fussball/typen";
import {
  sortierePartien,
  tabellenAusschnitt,
  spieltagTitel,
  waehleSpieltag,
} from "@/lib/kacheln/fussball/spieltag";

const TAGE = [
  "2026-11-06",
  "2026-11-07",
  "2026-11-08",
  "2026-11-20",
  "2026-11-21",
  "2026-11-22",
];

test("wählt den Block bis Mitternacht des Folgetags", () => {
  // 9.11. 23:59 deutscher Zeit
  expect(waehleSpieltag(TAGE, new Date("2026-11-09T22:59:00Z"))).toEqual([
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
  ]);
  // 10.11. 00:00 deutscher Zeit
  expect(waehleSpieltag(TAGE, new Date("2026-11-09T23:00:00Z"))).toEqual([
    "2026-11-20",
    "2026-11-21",
    "2026-11-22",
  ]);
});

test("nach dem letzten Block bleibt der letzte", () => {
  expect(waehleSpieltag(TAGE, new Date("2026-12-24T12:00:00Z"))).toEqual([
    "2026-11-20",
    "2026-11-21",
    "2026-11-22",
  ]);
});

const SPIELPLAN = new Map([
  ["2026-11-06", 9],
  ["2026-11-07", 9],
  ["2026-11-08", 9],
  ["2026-11-18", 5],
]);

test("Titel mit Nummer", () => {
  expect(
    spieltagTitel(["2026-11-06", "2026-11-07", "2026-11-08"], SPIELPLAN),
  ).toBe("9. Spieltag");
});

test("Nachholspiel", () => {
  expect(spieltagTitel(["2026-11-18"], SPIELPLAN)).toBe("Nachholspiel");
});

test("ohne Spielplan keine Nummer", () => {
  expect(spieltagTitel(["2026-11-06"], null)).toBeNull();
  expect(spieltagTitel(["2026-12-24"], SPIELPLAN)).toBeNull();
});

function partie(
  id: string,
  anstoss: string,
  heim: string,
  gast: string,
): Partie {
  const team = (name: string) => ({ id: name, name, logo: null, tore: null });
  return {
    id,
    anstoss,
    status: "vorher",
    minute: null,
    heim: team(heim),
    gast: team(gast),
    tore: [],
  };
}

test("Mein Team zuerst, dann nach Anstoß und Heimteam", () => {
  const partien = [
    partie("a", "2026-11-08T14:30Z", "Köln", "Leverkusen"),
    partie("b", "2026-11-07T14:30Z", "Paderborn", "Frankfurt"),
    partie("c", "2026-11-07T14:30Z", "Mainz", "Bayern"),
    partie("d", "2026-11-06T19:30Z", "HSV", "Gladbach"),
    partie("e", "2026-11-07T14:30Z", "Dortmund", "Elversberg"),
  ];
  expect(sortierePartien(partien, ["Bayern"]).map((p) => p.id)).toEqual([
    "c",
    "d",
    "e",
    "b",
    "a",
  ]);
});

const TABELLE: TabellenZeile[] = Array.from({ length: 18 }, (_, i) => ({
  platz: i + 1,
  id: `t${i + 1}`,
  name: `Team ${i + 1}`,
  logo: null,
  spiele: 9,
  differenz: 0,
  punkte: 30 - i,
}));

function plaetze(ausschnitt: (TabellenZeile | null)[]) {
  return ausschnitt.map((zeile) => zeile?.platz ?? null);
}

test("Ausschnitt um Mein Team", () => {
  expect(plaetze(tabellenAusschnitt(TABELLE, ["t6"]))).toEqual([
    1,
    null,
    4,
    5,
    6,
    7,
    8,
  ]);
  expect(plaetze(tabellenAusschnitt(TABELLE, ["t1"]))).toEqual([1, 2, 3]);
  expect(plaetze(tabellenAusschnitt(TABELLE, ["t2"]))).toEqual([1, 2, 3, 4]);
  expect(plaetze(tabellenAusschnitt(TABELLE, ["t18"]))).toEqual([
    1,
    null,
    16,
    17,
    18,
  ]);
  expect(plaetze(tabellenAusschnitt(TABELLE, []))).toEqual([1, 2, 3, 4, 5]);
});
