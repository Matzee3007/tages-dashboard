// @vitest-environment node
import { expect, test } from "vitest";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { pruefeBericht } from "@/lib/spielbericht/pruefung";
import { GUELTIG, PARTIE, TICKER } from "./spielbericht-beispiel";

function antwort(
  felder: { bericht?: string; spieler?: string[] } = {},
): string {
  return JSON.stringify({
    bericht: GUELTIG,
    spieler: ["García", "Kainz", "Schick"],
    ...felder,
  });
}

test("nimmt einen gültigen Spielbericht an", () => {
  expect(pruefeBericht(antwort(), PARTIE, TICKER)).toBe(GUELTIG);
});

test.each([
  ["kaputtes JSON", '{"bericht":'],
  ["ohne Liste der Spieler", JSON.stringify({ bericht: GUELTIG })],
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
  [
    "Spieler erfunden",
    antwort({ spieler: ["García", "Kainz", "Schick", "Müller"] }),
  ],
])("verwirft: %s", (_, inhalt) => {
  expect(pruefeBericht(inhalt, PARTIE, TICKER)).toBeNull();
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
  expect(
    pruefeBericht(JSON.stringify({ bericht, spieler: [] }), nullNull, TICKER),
  ).toBe(bericht);
});
