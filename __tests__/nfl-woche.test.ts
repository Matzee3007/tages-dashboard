import { expect, test } from "vitest";
import type { Woche } from "@/lib/kacheln/nfl/espn";
import { waehleWoche } from "@/lib/kacheln/nfl/woche";

// Kalender von ESPN: Woche 11 vom 18.11. 08:00Z bis 25.11. 07:59Z, Woche 12 bis 02.12. 07:59Z, Woche 18 als letzte.
const WOCHEN: Woche[] = Array.from({ length: 18 }, (_, i) => {
  const start = new Date(Date.UTC(2026, 8, 9, 8) + i * 7 * 86_400_000);
  const ende = new Date(start.getTime() + 7 * 86_400_000 - 60_000);
  return {
    nummer: i + 1,
    start: start.toISOString().replace(":00.000", ""),
    ende: ende.toISOString().replace(":00.000", ""),
  };
});

// Deutsche Spieltage: Woche 11 Fr 20., So 22., Mo 23., Di 24.; Woche 12 Do 26. bis Di 1. Dezember.
const TAGE: Record<number, string[]> = {
  11: ["2026-11-20", "2026-11-22", "2026-11-23", "2026-11-24"],
  12: ["2026-11-26", "2026-11-27", "2026-11-29", "2026-11-30", "2026-12-01"],
};
const tageJeWoche = (nummer: number) => TAGE[nummer];

test("die Wochen des Kalenders passen zum Fixture", () => {
  expect(WOCHEN[10].start).toBe("2026-11-18T08:00Z");
  expect(WOCHEN[11].start).toBe("2026-11-25T08:00Z");
});

test("am Dienstag nach dem Montagsspiel gilt die alte Woche", () => {
  expect(
    waehleWoche(WOCHEN, tageJeWoche, new Date("2026-11-24T10:00:00Z")),
  ).toBe(11);
});

test("am Mittwoch bleibt die alte Woche bis Mitternacht, obwohl der Kalender schon die neue nennt", () => {
  expect(
    waehleWoche(WOCHEN, tageJeWoche, new Date("2026-11-25T11:00:00Z")),
  ).toBe(11);
});

test("ab Donnerstag 0 Uhr deutscher Zeit gilt die neue Woche", () => {
  expect(
    waehleWoche(WOCHEN, tageJeWoche, new Date("2026-11-25T23:30:00Z")),
  ).toBe(12);
});

test("vor der ersten Woche gilt Woche 1, nach der letzten Woche 18", () => {
  expect(
    waehleWoche(WOCHEN, tageJeWoche, new Date("2026-08-01T12:00:00Z")),
  ).toBe(1);
  expect(
    waehleWoche(WOCHEN, tageJeWoche, new Date("2027-02-20T12:00:00Z")),
  ).toBe(18);
});

test("ohne Tage der Vorwoche gilt die Woche des Kalenders", () => {
  expect(
    waehleWoche(WOCHEN, () => undefined, new Date("2026-11-25T11:00:00Z")),
  ).toBe(12);
});
