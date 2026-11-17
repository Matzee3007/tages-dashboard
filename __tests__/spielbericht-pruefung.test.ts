// @vitest-environment node
import { expect, test } from "vitest";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { pruefeBericht, pruefeMitGrund } from "@/lib/spielbericht/pruefung";
import { GUELTIG, PARTIE } from "./spielbericht-beispiel";

function antwort(felder: { bericht?: string } = {}): string {
  return JSON.stringify({ bericht: GUELTIG, ...felder });
}

test("nimmt einen gültigen Spielbericht an", () => {
  expect(pruefeBericht(antwort(), PARTIE)).toBe(GUELTIG);
});

test.each([
  ["kaputtes JSON", '{"bericht":'],
  ["falsches Feld", JSON.stringify({ text: GUELTIG })],
  [
    "3 Sätze",
    antwort({ bericht: "García traf. Kainz glich aus. Schick traf zum 1:2." }),
  ],
  ["7 Sätze", antwort({ bericht: GUELTIG + " Das war knapp. Es regnete." })],
  [
    "englisch",
    antwort({
      bericht:
        "García scored in the 7th minute. Kainz equalised for Cologne. The second half was even. " +
        "Schick headed the winner. It ended 1:2 in Cologne.",
    }),
  ],
  [
    "über 900 Zeichen",
    antwort({
      bericht: GUELTIG.replace("lange fiel kein Tor", "x".repeat(800)),
    }),
  ],
  ["Endstand verdreht", antwort({ bericht: GUELTIG.replace("1:2", "2:1") })],
  [
    "Torschütze fehlt",
    antwort({ bericht: GUELTIG.replace("köpfte Schick", "köpfte ein Joker") }),
  ],
])("verwirft: %s", (_, inhalt) => {
  expect(pruefeBericht(inhalt, PARTIE)).toBeNull();
});

test("nimmt beim 0:0 einen Bericht ohne Torschützen an", () => {
  const nullNull: Partie = {
    ...PARTIE,
    heim: { ...PARTIE.heim, tore: 0 },
    gast: { ...PARTIE.gast, tore: 0 },
    tore: [],
  };
  const bericht =
    "Köln und Leverkusen trennten sich torlos. Beide Teams spielten vorsichtig. " +
    "Die besten Chancen hatte Leverkusen nach der Pause. Köln verteidigte bis zum Schluss. " +
    "Am Ende steht ein 0:0.";
  expect(pruefeBericht(JSON.stringify({ bericht }), nullNull)).toBe(bericht);
});

test("nennt den Grund, warum ein Spielbericht verworfen wird", () => {
  expect(pruefeMitGrund(antwort(), PARTIE)).toEqual({
    bericht: GUELTIG,
  });
  expect(
    pruefeMitGrund(antwort({ bericht: GUELTIG.replace("1:2", "2:1") }), PARTIE),
  ).toEqual({ grund: "Endstand 1:2 fehlt" });
  expect(
    pruefeMitGrund(
      antwort({
        bericht: GUELTIG.replace("köpfte Schick", "köpfte ein Joker"),
      }),
      PARTIE,
    ),
  ).toEqual({ grund: "Torschütze fehlt: Schick" });
});
