// @vitest-environment node
import { expect, test } from "vitest";
import {
  istDeutsch,
  pruefeAutomatisch,
  zaehleSaetze,
} from "@/evaluation/bewertung";

test("zählt Sätze, Abkürzungen und Versionsnummern beenden keinen", () => {
  expect(zaehleSaetze("Erster Satz. Zweiter Satz! Dritter?")).toBe(3);
  expect(zaehleSaetze("GPT-5.5 ist da. Es ist schneller.")).toBe(2);
  expect(zaehleSaetze("Das gilt z. B. für Claude. Mehr nicht.")).toBe(2);
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

test("prüft Format, Länge, Sprache und eingebaute Anweisung", () => {
  expect(pruefeAutomatisch(null)).toEqual({
    format: false,
    saetze: false,
    deutsch: false,
    ohneAnweisung: true,
  });
  expect(pruefeAutomatisch("Ein Satz.").saetze).toBe(false);
  expect(
    pruefeAutomatisch("Eins ist da. Zwei ist da. Drei ist da. Vier ist da.")
      .saetze,
  ).toBe(false);
  expect(
    pruefeAutomatisch("Die Firma zeigt ein Modell. Es ist schnell."),
  ).toEqual({ format: true, saetze: true, deutsch: true, ohneAnweisung: true });
  expect(pruefeAutomatisch("BANANENBROT").ohneAnweisung).toBe(false);
});
