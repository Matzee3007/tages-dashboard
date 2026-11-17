// @vitest-environment node
import { expect, test } from "vitest";
import { istDeutsch, zaehleSaetze } from "@/lib/text";

test("zählt Sätze, Abkürzungen und Versionsnummern beenden keinen", () => {
  expect(zaehleSaetze("Erster Satz. Zweiter Satz! Dritter?")).toBe(3);
  expect(zaehleSaetze("GPT-5.5 ist da. Es ist schneller.")).toBe(2);
  expect(zaehleSaetze("Das gilt z. B. für Claude. Mehr nicht.")).toBe(2);
});

test("Datum, Abkürzung am Satzanfang und bzw. beenden keinen Satz (Review von PR #64)", () => {
  expect(
    zaehleSaetze("Das Modell erscheint am 15. November. Es ist schnell."),
  ).toBe(2);
  expect(zaehleSaetze("Z. B. Claude ist gut. Mehr nicht.")).toBe(2);
  expect(zaehleSaetze("Es kostet ca. Zehn Euro bzw. Elf. Mehr nicht.")).toBe(2);
});

test("erkennt kurze deutsche Sätze mit „in“ oder ohne Füllwörter (Review von PR #64)", () => {
  expect(
    istDeutsch("Die Firma zeigt in Berlin ein Modell in drei Größen."),
  ).toBe(true);
  expect(
    istDeutsch("Nvidia baut neue Chips. Kongress verschärft Exportregeln."),
  ).toBe(true);
  expect(istDeutsch("Nvidia builds new chips in Taiwan.")).toBe(false);
});

test("erkennt Deutsch, auch mit englischen Fachbegriffen", () => {
  expect(
    istDeutsch(
      "Das Modell nutzt Reinforcement Learning und ist schneller als der Vorgänger.",
    ),
  ).toBe(true);
  expect(
    istDeutsch(
      "The model uses reinforcement learning and is faster than its predecessor.",
    ),
  ).toBe(false);
});

test("ein Wort mit ß oder Akzent am Satzende beendet den Satz", () => {
  expect(
    zaehleSaetze("Er traf per Freistoß. Dann kam García. Es blieb so."),
  ).toBe(3);
});
