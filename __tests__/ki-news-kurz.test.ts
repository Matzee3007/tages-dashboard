import { expect, test } from "vitest";
import { kiNewsKurz } from "@/lib/kacheln/ki-news/kurz";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";

const JETZT = new Date("2026-11-23T12:00:00Z");
const aussehen = { farbe: "#8E99A8" };

const absender = (
  name: string,
  meldungen: AbsenderStand["meldungen"],
  erreichbar = true,
): AbsenderStand => ({
  name,
  aussehen,
  meldungen,
  letzteMeldung: meldungen[0]?.zeit ?? null,
  erreichbar,
});

const meldung = (titel: string, zeit: string, nurDatum?: true) => ({
  titel,
  link: `https://example.com/${titel}`,
  zeit,
  ...(nurDatum && { nurDatum }),
});

test("nur frische Meldungen aller Absender, neueste zuerst", () => {
  const neu = kiNewsKurz(
    {
      art: "ki-news",
      absender: [
        absender("Anthropic", [
          meldung("a-neu", "2026-11-23T08:00:00Z"),
          meldung("a-alt", "2026-11-21T08:00:00Z"),
        ]),
        absender("t3n", [meldung("t-neuer", "2026-11-23T11:00:00Z")]),
      ],
    },
    JETZT,
  );
  expect(
    neu.map((eintrag) => [eintrag.absender, eintrag.meldung.titel]),
  ).toEqual([
    ["t3n", "t-neuer"],
    ["Anthropic", "a-neu"],
  ]);
  expect(neu[0].aussehen).toEqual(aussehen);
});

test("ohne Uhrzeit zählt auch gestern, ein unerreichbarer Absender zählt mit", () => {
  const neu = kiNewsKurz(
    {
      art: "ki-news",
      absender: [
        absender("Karpathy", [
          meldung("gestern", "2026-11-22T00:00:00Z", true),
        ]),
        absender(
          "Matt Pocock",
          [meldung("alt", "2026-11-23T09:00:00Z")],
          false,
        ),
      ],
    },
    JETZT,
  );
  expect(neu.map((eintrag) => eintrag.meldung.titel)).toEqual([
    "alt",
    "gestern",
  ]);
});

test("ohne frische Meldung ist die Liste leer", () => {
  expect(
    kiNewsKurz(
      {
        art: "ki-news",
        absender: [
          absender("OpenAI", [meldung("alt", "2026-11-20T09:00:00Z")]),
        ],
      },
      JETZT,
    ),
  ).toEqual([]);
});
