// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { ladeLiveticker, leseLiveticker } from "@/lib/spielbericht/liveticker";

const JETZT = new Date("2026-11-08T19:00:00Z");

const ANTWORT = {
  commentary: [
    { time: { displayValue: "" }, text: "First Half begins." },
    {
      time: { displayValue: "7'" },
      text: "Goal! FC Cologne 0, Bayer 04 Leverkusen 1.",
    },
    { time: { displayValue: "8'" } },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test("macht aus jedem Eintrag des Livetickers eine Zeile mit Minute", () => {
  expect(leseLiveticker(ANTWORT)).toEqual([
    "First Half begins.",
    "7' Goal! FC Cologne 0, Bayer 04 Leverkusen 1.",
  ]);
});

test.each([
  ["Feld fehlt", {}],
  ["leer", { commentary: [] }],
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
