// @vitest-environment node
import { expect, test } from "vitest";
import {
  leseErgebnis,
  leseKalender,
  leseQualifying,
  leseWertung,
} from "@/lib/kacheln/formel-1/jolpica";
import ergebnis from "@/__tests__/fixtures/f1-ergebnis.json";
import fahrer from "@/__tests__/fixtures/f1-fahrer.json";
import kalender from "@/__tests__/fixtures/f1-kalender.json";
import qualifying from "@/__tests__/fixtures/f1-qualifying.json";
import teams from "@/__tests__/fixtures/f1-teams.json";

// Gekürzte echte Antworten von Jolpica vom 2026-11-25 (Saison 2026, Ergebnisse von Las Vegas, Runde 21).

test("leseKalender: 23 Rennen mit deutschem Namen, Ort und Sessions nach Start", () => {
  const rennen = leseKalender(kalender);
  expect(rennen).toHaveLength(23);
  const katar = rennen[21];
  expect(katar).toMatchObject({
    saison: 2026,
    runde: 22,
    name: "Großer Preis von Katar",
    ort: "Lusail",
  });
  expect(katar.sessions.map((s) => s.name)).toEqual([
    "1. Training",
    "2. Training",
    "3. Training",
    "Qualifying",
    "Rennen",
  ]);
  expect(katar.sessions.at(-1)).toEqual({
    art: "rennen",
    name: "Rennen",
    start: "2026-11-29T16:00:00Z",
    status: "vorher",
  });
  expect(katar.sessions.every((s) => s.status === "vorher")).toBe(true);
});

test("ein Sprint-Wochenende hat Sprint-Qualifying und Sprint nach dem 1. Training", () => {
  const china = leseKalender(kalender)[1];
  expect(china.sessions.map((s) => s.art)).toEqual([
    "training1",
    "sprintQualifying",
    "sprint",
    "qualifying",
    "rennen",
  ]);
});

test("ein unbekannter Name bleibt englisch", () => {
  const malaysia = leseKalender(kalender)[15];
  expect(malaysia.name).toBe("Bahrain Grand Prix in Malaysia");
});

test("leseQualifying: Top 10 mit der besten Zeit und deutschem Komma", () => {
  const zeilen = leseQualifying(qualifying);
  expect(zeilen).toHaveLength(10);
  expect(zeilen[0]).toEqual({
    platz: 1,
    kuerzel: "ANT",
    name: "Antonelli",
    team: "Mercedes",
    zeit: "1:33,893",
  });
});

test("leseErgebnis: Top 10, Sieger mit Gesamtzeit, dann Abstand", () => {
  const zeilen = leseErgebnis(ergebnis);
  expect(zeilen).toHaveLength(10);
  expect(zeilen[0]).toMatchObject({
    platz: 1,
    kuerzel: "VER",
    zeit: "1:27:39,624",
  });
  expect(zeilen[1]).toMatchObject({ platz: 2, kuerzel: "NOR", zeit: "+0,639" });
});

test("leseErgebnis: Überrundete und Ausfälle", () => {
  const roh = structuredClone(ergebnis);
  const liste = roh.MRData.RaceTable.Races[0].Results;
  liste[8] = { ...liste[8], status: "+1 Lap", Time: undefined } as never;
  liste[9] = { ...liste[9], status: "Retired", Time: undefined } as never;
  const zeilen = leseErgebnis(roh);
  expect(zeilen[8].zeit).toBe("+1 Rd.");
  expect(zeilen[9].zeit).toBe("Ausfall");
});

test("leseWertung: Fahrer und Teams mit Runde", () => {
  const f = leseWertung(fahrer, "fahrer");
  expect(f.nachRunde).toBe(21);
  expect(f.zeilen[0]).toEqual({
    platz: 1,
    name: "Antonelli",
    team: "Mercedes",
    punkte: 402,
  });
  const t = leseWertung(teams, "teams");
  expect(t.zeilen[0]).toEqual({ platz: 1, name: "Mercedes", punkte: 666 });
});

test("falsche Form wirft", () => {
  expect(() => leseKalender({})).toThrow("Unerwartete Antwort von Jolpica");
  expect(() => leseWertung({}, "fahrer")).toThrow(
    "Unerwartete Antwort von Jolpica",
  );
});

test("vor der Session ist die Liste leer: keine Zeilen statt Fehler", () => {
  const leer = { MRData: { RaceTable: { Races: [] } } };
  expect(leseQualifying(leer)).toEqual([]);
  expect(leseErgebnis(leer)).toEqual([]);
});
