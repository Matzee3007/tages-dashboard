// @vitest-environment node
import { expect, test } from "vitest";
import {
  istDeutsch,
  pruefeAutomatisch,
  werteAus,
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

const basis = { modell: "m", gekuerzt: false, titel: "t" };
const ok = { format: true, saetze: true, deutsch: true, ohneAnweisung: true };

test("Treffer: Urteil ja, beim Video keine Zusammenfassung", () => {
  const auswertung = werteAus([
    {
      ...basis,
      link: "1",
      art: "normal",
      zusammenfassung: "A. B.",
      sekunden: 10,
      auto: ok,
      urteil: "ja",
    },
    {
      ...basis,
      link: "2",
      art: "normal",
      zusammenfassung: "A. B.",
      sekunden: 30,
      auto: ok,
      urteil: "nein",
    },
    {
      ...basis,
      link: "3",
      art: "video",
      zusammenfassung: null,
      sekunden: null,
      auto: {
        format: false,
        saetze: false,
        deutsch: false,
        ohneAnweisung: true,
      },
      urteil: null,
    },
    {
      ...basis,
      link: "4",
      art: "normal",
      zusammenfassung: "A. B.",
      sekunden: 20,
      auto: ok,
      urteil: null,
    },
  ]);
  expect(auswertung).toMatchObject({
    modell: "m",
    treffer: 2,
    von: 4,
    offen: 1,
    format: 3,
    sekundenMedian: 20,
    sekundenMax: 30,
  });
});
