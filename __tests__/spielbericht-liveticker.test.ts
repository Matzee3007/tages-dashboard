// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { ladeLiveticker, leseLiveticker } from "@/lib/spielbericht/liveticker";

const JETZT = new Date("2026-11-08T19:00:00Z");

const ANTWORT = {
  keyEvents: [
    { clock: { displayValue: "" }, type: { text: "Kickoff" } },
    {
      clock: { displayValue: "7'" },
      type: { text: "Goal - Free-kick" },
      text: "Goal! FC Cologne 0, Bayer 04 Leverkusen 1.",
    },
    {
      clock: { displayValue: "74'" },
      type: { text: "Substitution" },
      text: "Substitution, FC Cologne. Ísak Jóhannesson replaces Tom Krauß.",
    },
    {
      clock: { displayValue: "90'+6'" },
      type: { text: "End Regular Time" },
      text: "Second Half ends, FC Cologne 1, Bayer 04 Leverkusen 2.",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("macht aus jedem wichtigen Eintrag eine Zeile mit Minute, ohne Wechsel", () => {
  expect(leseLiveticker(ANTWORT)).toEqual([
    "7' Goal! FC Cologne 0, Bayer 04 Leverkusen 1.",
    "90'+6' Second Half ends, FC Cologne 1, Bayer 04 Leverkusen 2.",
  ]);
});

test.each([
  ["Feld fehlt", {}],
  ["leer", { keyEvents: [] }],
  ["kein Objekt", null],
])("ohne Liveticker: %s", (_, json) => {
  expect(leseLiveticker(json)).toBeNull();
});

test("holt den Liveticker einer Partie bei ESPN", async () => {
  const fetchMock = vi.fn(async () => Response.json(ANTWORT));
  vi.stubGlobal("fetch", fetchMock);

  expect(await ladeLiveticker("ger.1", "401884738", JETZT)).toHaveLength(2);
  expect(fetchMock).toHaveBeenCalledWith(
    "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/summary?event=401884738",
    expect.objectContaining({
      headers: expect.objectContaining({ "User-Agent": "Tages-Dashboard" }),
    }),
  );
});
