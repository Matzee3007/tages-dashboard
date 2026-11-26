import { expect, test } from "vitest";
import { leseKalender } from "@/lib/kacheln/formel-1/jolpica";
import { formel1Kurz } from "@/lib/kacheln/formel-1/kurz";
import type { Formel1Daten } from "@/lib/kacheln/formel-1/typen";
import { waehleRennen } from "@/lib/kacheln/formel-1/wochenende";
import kalender from "@/__tests__/fixtures/f1-kalender.json";

const daten = (jetzt: string): Formel1Daten => ({
  art: "formel-1",
  rennen: waehleRennen(leseKalender(kalender), new Date(jetzt)),
  letzteRunde: 23,
  winterpause: false,
  ergebnis: null,
  fahrer: null,
  teams: null,
  wertungNachRunde: null,
  saisonstart: null,
});

test("eine laufende Session mit Name und Rennen", () => {
  expect(formel1Kurz(daten("2026-11-29T16:30:00Z"))).toEqual({
    session: "Rennen",
    rennen: "Großer Preis von Katar",
  });
  expect(formel1Kurz(daten("2026-11-28T18:10:00Z"))?.session).toBe(
    "Qualifying",
  );
});

test("ohne laufende Session null", () => {
  expect(formel1Kurz(daten("2026-11-25T10:00:00Z"))).toBeNull();
});
