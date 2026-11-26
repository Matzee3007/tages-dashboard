import { expect, test } from "vitest";
import { leseKalender } from "@/lib/kacheln/formel-1/jolpica";
import {
  istWinterpause,
  waehleRennen,
} from "@/lib/kacheln/formel-1/wochenende";
import kalender from "@/__tests__/fixtures/f1-kalender.json";

const RENNEN = leseKalender(kalender);
const status = (jetzt: string) =>
  Object.fromEntries(
    waehleRennen(RENNEN, new Date(jetzt)).sessions.map((s) => [
      s.art,
      s.status,
    ]),
  );

// Katar: 1. Training Fr 27.11. 13:30Z, Qualifying Sa 28.11. 18:00Z, Rennen So 29.11. 16:00Z (deutsche Zeit +1 Std.).

test("am Mittwoch vor dem Wochenende: Katar, alles vorher", () => {
  const katar = waehleRennen(RENNEN, new Date("2026-11-25T10:00:00Z"));
  expect(katar.runde).toBe(22);
  expect(katar.sessions.every((s) => s.status === "vorher")).toBe(true);
});

test("Samstag nach dem Qualifying: Qualifying vorbei, Rennen vorher", () => {
  expect(status("2026-11-28T19:30:00Z")).toMatchObject({
    training1: "vorbei",
    qualifying: "vorbei",
    rennen: "vorher",
  });
});

test("während des Qualifyings läuft es 60 Minuten lang", () => {
  expect(status("2026-11-28T18:59:00Z").qualifying).toBe("laeuft");
  expect(status("2026-11-28T19:00:00Z").qualifying).toBe("vorbei");
});

test("das Rennen läuft 180 Minuten, auch mit roter Flagge", () => {
  expect(status("2026-11-29T18:30:00Z").rennen).toBe("laeuft");
  expect(status("2026-11-29T19:00:00Z").rennen).toBe("vorbei");
});

test("Katar bleibt bis Mitternacht nach dem Tag nach dem Rennen, dann kommt Abu Dhabi", () => {
  expect(waehleRennen(RENNEN, new Date("2026-11-30T22:00:00Z")).runde).toBe(22);
  expect(waehleRennen(RENNEN, new Date("2026-11-30T23:30:00Z")).runde).toBe(23);
});

test("nach dem letzten Rennen: Abu Dhabi bleibt, Winterpause", () => {
  const jetzt = new Date("2026-12-09T08:00:00Z");
  expect(waehleRennen(RENNEN, jetzt).runde).toBe(23);
  expect(istWinterpause(RENNEN, jetzt)).toBe(true);
  expect(istWinterpause(RENNEN, new Date("2026-11-25T10:00:00Z"))).toBe(false);
});

test("eine Session ohne Uhrzeit läuft nie, ist nach ihrem Tag vorbei", () => {
  const ohne = structuredClone(RENNEN);
  ohne[21].sessions[0] = {
    ...ohne[21].sessions[0],
    start: "2026-11-27T00:00:00Z",
    ohneZeit: true,
  };
  const an = (jetzt: string) =>
    waehleRennen(ohne, new Date(jetzt)).sessions[0].status;
  expect(an("2026-11-27T12:00:00Z")).toBe("vorher");
  expect(an("2026-11-28T12:00:00Z")).toBe("vorbei");
});

test("vor der neuen Saison ist Winterpause bis 7 Tage vor der ersten Session", () => {
  // Runde 1 2026: 1. Training am 6. März.
  const ersterTag = RENNEN[0].sessions[0].start.slice(0, 10);
  expect(ersterTag).toBe("2026-03-06");
  expect(istWinterpause(RENNEN, new Date("2026-02-20T12:00:00Z"))).toBe(true);
  expect(istWinterpause(RENNEN, new Date("2026-02-27T12:00:00Z"))).toBe(false);
});
