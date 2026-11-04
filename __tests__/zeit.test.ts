import { expect, test } from "vitest";
import { datum, standText, uhrzeit, uhrzeitMitSekunden } from "@/lib/zeit";

test("zeigt die Winterzeit mit Sekunden", () => {
  expect(uhrzeitMitSekunden("2026-11-08T13:32:07Z")).toBe("14:32:07");
});

test("zeigt die Sommerzeit", () => {
  expect(uhrzeit("2026-07-01T12:00:00Z")).toBe("14:00");
});

test("kurz nach Mitternacht beginnt der neue Tag bei 00 Uhr", () => {
  expect(uhrzeit("2026-11-07T23:05:00Z")).toBe("00:05");
  expect(datum("2026-11-07T23:05:00Z")).toBe("Sonntag, 8. November");
});

test("ein Stand von heute nennt nur die Uhrzeit", () => {
  expect(
    standText("2026-11-08T13:31:00Z", new Date("2026-11-08T14:00:00Z")),
  ).toBe("14:31");
});

test("ein Stand von gestern nennt auch das Datum, nach deutscher Zeit", () => {
  expect(
    standText("2026-11-07T22:58:00Z", new Date("2026-11-07T23:05:00Z")),
  ).toBe("Samstag, 7. November, 23:58");
});
