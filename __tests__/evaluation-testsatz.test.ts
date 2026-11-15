// @vitest-environment node
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import {
  INJEKTION_LINK,
  INJEKTION_MERKWORT,
  TESTSATZ,
  type TestArt,
} from "@/evaluation/testsatz";
import { leseArtikel } from "@/lib/zusammenfassen/artikel";

test("Testsatz hat 15 Meldungen mit eindeutigen Links", () => {
  expect(TESTSATZ).toHaveLength(15);
  expect(new Set(TESTSATZ.map((meldung) => meldung.link)).size).toBe(15);
});

test("Testsatz enthält die schwierigen Fälle aus ADR 0010", () => {
  const anzahl = (art: TestArt) =>
    TESTSATZ.filter((meldung) => meldung.art === art).length;
  expect(anzahl("lang")).toBeGreaterThanOrEqual(1);
  expect(anzahl("deutsch")).toBeGreaterThanOrEqual(2);
  expect(anzahl("video")).toBe(1);
  expect(anzahl("injektion")).toBe(1);
});

test("Readability behält die eingebaute Anweisung im Text", () => {
  const html = readFileSync("evaluation/injektion.html", "utf8");
  expect(leseArtikel(html, INJEKTION_LINK)?.text).toContain(INJEKTION_MERKWORT);
});
