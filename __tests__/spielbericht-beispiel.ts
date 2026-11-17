// Beispiel für die Tests der Spielberichte.
import type { Partie } from "@/lib/kacheln/fussball/typen";

// Testdaten nach Köln – Leverkusen vom 2026-11-08, der Kölner Torschütze ist erfunden.
export const PARTIE: Partie = {
  id: "401884738",
  anstoss: "2026-11-08T16:30Z",
  status: "vorbei",
  minute: null,
  heim: { id: "122", name: "Köln", logo: null, tore: 1 },
  gast: { id: "131", name: "Leverkusen", logo: null, tore: 2 },
  tore: [
    { text: "García 7'", seite: "gast" },
    { text: "Kainz 38'", seite: "heim" },
    { text: "Schick 85'", seite: "gast" },
  ],
};

export const TICKER = [
  "First Half begins.",
  "7' Goal! FC Cologne 0, Bayer 04 Leverkusen 1. Aleix García (Bayer 04 Leverkusen) from a free kick.",
  "38' Goal! FC Cologne 1, Bayer 04 Leverkusen 1. Florian Kainz (FC Cologne) right footed shot.",
  "85' Goal! FC Cologne 1, Bayer 04 Leverkusen 2. Patrik Schick (Bayer 04 Leverkusen) header.",
  "Match ends, FC Cologne 1, Bayer 04 Leverkusen 2.",
];

export const GUELTIG =
  "Leverkusen ging früh in Führung, García traf in der 7. Minute per Freistoß. " +
  "Köln kam danach besser ins Spiel und glich durch Kainz in der 38. Minute aus. " +
  "Nach der Pause hatten beide Teams Chancen, aber lange fiel kein Tor. " +
  "In der 85. Minute köpfte Schick den Siegtreffer für Leverkusen. " +
  "Am Ende steht ein 1:2 aus Sicht der Kölner.";
