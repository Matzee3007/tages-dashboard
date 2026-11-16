import { afterEach, expect, test, vi } from "vitest";
import { ABSENDER, type KachelEinstellung } from "@/lib/einstellungen";
import { TEAMS_BUNDESLIGA } from "@/lib/einstellungen";
import { ladeFussball } from "@/lib/kacheln/fussball/laden";
import type { FussballDaten } from "@/lib/kacheln/fussball/typen";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import { ladeKiNews } from "@/lib/kacheln/ki-news/laden";
import { ladeDashboard } from "@/lib/kacheln/laden";

vi.mock("@/lib/kacheln/ki-news/laden", () => ({ ladeKiNews: vi.fn() }));
vi.mock("@/lib/kacheln/fussball/laden", () => ({ ladeFussball: vi.fn() }));

const JETZT = new Date("2026-11-08T13:32:07Z");

const ANTHROPIC: AbsenderStand = {
  name: "Anthropic",
  meldungen: [
    {
      titel: "Introducing Claude",
      link: "https://www.anthropic.com/news/claude",
      zeit: "2026-11-08T10:00:00.000Z",
    },
  ],
  letzteMeldung: "2026-11-08T10:00:00.000Z",
  erreichbar: true,
};

function kachel(id: string): KachelEinstellung {
  return { id, art: "ki-news", titel: `Kachel ${id}` };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.mocked(ladeKiNews).mockReset();
});

test("die KI-News-Kachel liefert die Absender aus den Einstellungen", async () => {
  vi.mocked(ladeKiNews).mockResolvedValue([ANTHROPIC]);

  const antwort = await ladeDashboard(
    [{ id: "ki-news", art: "ki-news", titel: "KI-News" }],
    JETZT,
  );

  expect(ladeKiNews).toHaveBeenCalledWith(ABSENDER, JETZT, "ki-news");
  expect(antwort.kacheln).toEqual([
    {
      id: "ki-news",
      titel: "KI-News",
      status: "ok",
      daten: { art: "ki-news", absender: [ANTHROPIC] },
      stand: "2026-11-08T13:32:07.000Z",
    },
  ]);
});

test("eine fehlerhafte Kachel stört die andere nicht, die Reihenfolge bleibt", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(ladeKiNews)
    .mockRejectedValueOnce(new Error("Testfehler"))
    .mockResolvedValueOnce([ANTHROPIC]);

  const antwort = await ladeDashboard([kachel("a"), kachel("b")], JETZT);

  expect(antwort.zeit).toBe("2026-11-08T13:32:07.000Z");
  expect(antwort.kacheln).toEqual([
    { id: "a", titel: "Kachel a", status: "fehler" },
    {
      id: "b",
      titel: "Kachel b",
      status: "ok",
      daten: { art: "ki-news", absender: [ANTHROPIC] },
      stand: "2026-11-08T13:32:07.000Z",
    },
  ]);
});

test("der Fehlertext bleibt auf dem Server", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(ladeKiNews).mockRejectedValue(new Error("Testfehler"));

  const antwort = await ladeDashboard([kachel("a")], JETZT);

  const text = JSON.stringify(antwort);
  expect(text).not.toContain("Testfehler");
  expect(text).not.toContain("stack");
  expect(log).toHaveBeenCalled();
});

test("die Bundesliga-Kachel ruft ladeFussball mit Einstellung und Zeit", async () => {
  const einstellung = {
    id: "bundesliga",
    art: "fussball" as const,
    titel: "Bundesliga",
    espn: "ger.1" as const,
    kalender: { art: "espn" as const },
    spielplan: { art: "openligadb" as const, liga: "bl1" as const },
    tabelle: { art: "espn" as const },
    teams: TEAMS_BUNDESLIGA,
    meinTeam: ["132"],
  };
  const daten: FussballDaten = {
    art: "fussball",
    titel: "9. Spieltag",
    tage: ["2026-11-08"],
    partien: [],
    tabelle: [],
    meinTeam: ["132"],
  };
  vi.mocked(ladeFussball).mockResolvedValue(daten);

  const antwort = await ladeDashboard([einstellung], JETZT);

  expect(ladeFussball).toHaveBeenCalledWith(einstellung, JETZT);
  expect(antwort.kacheln[0]).toMatchObject({ status: "ok", daten });
});
