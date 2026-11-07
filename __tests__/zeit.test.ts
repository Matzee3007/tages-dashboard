import { expect, test } from "vitest";
import { alterText, datum, istFrisch, standText, uhrzeit } from "@/lib/zeit";

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

const JETZT = new Date("2026-11-08T13:32:00Z"); // 14:32 in Berlin

test("nennt Minuten und Stunden unter einem Tag", () => {
  expect(alterText("2026-11-08T13:31:50Z", JETZT)).toBe("vor 1 Min.");
  expect(alterText("2026-11-08T13:00:00Z", JETZT)).toBe("vor 32 Min.");
  expect(alterText("2026-11-08T10:02:00Z", JETZT)).toBe("vor 3 Std.");
  expect(alterText("2026-11-07T14:00:00Z", JETZT)).toBe("vor 23 Std.");
});

test("nennt ab 24 Stunden Kalendertage", () => {
  expect(alterText("2026-11-07T12:00:00Z", JETZT)).toBe("gestern");
  expect(alterText("2026-11-04T08:00:00Z", JETZT)).toBe("vor 4 Tagen");
});

test("zählt Kalendertage in deutscher Zeit", () => {
  // 00:30 in Berlin am 7.11., in UTC noch der 6.11.
  expect(
    alterText("2026-11-06T23:30:00Z", new Date("2026-11-08T00:45:00Z")),
  ).toBe("gestern");
});

test("genau 24 Stunden sind nicht mehr frisch", () => {
  expect(istFrisch("2026-11-07T13:33:00Z", JETZT)).toBe(true);
  expect(istFrisch("2026-11-07T13:32:00Z", JETZT)).toBe(false);
  expect(alterText("2026-11-07T13:32:00Z", JETZT)).toBe("gestern");
});

test("ohne Uhrzeit nennt das Alter nur Kalendertage, mit heute", () => {
  expect(alterText("2026-11-08T00:00:00Z", JETZT, true)).toBe("heute");
  expect(alterText("2026-11-07T00:00:00Z", JETZT, true)).toBe("gestern");
  expect(alterText("2026-11-05T00:00:00Z", JETZT, true)).toBe("vor 3 Tagen");
});

test("ohne Uhrzeit ist eine Meldung von heute und gestern frisch", () => {
  expect(istFrisch("2026-11-08T00:00:00Z", JETZT, true)).toBe(true);
  expect(istFrisch("2026-11-07T00:00:00Z", JETZT, true)).toBe(true);
  expect(istFrisch("2026-11-06T00:00:00Z", JETZT, true)).toBe(false);
});
