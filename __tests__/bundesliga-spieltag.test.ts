// @vitest-environment node
import { expect, test } from "vitest";
import {
  spieltagTitel,
  waehleSpieltag,
} from "@/lib/kacheln/bundesliga/spieltag";

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
