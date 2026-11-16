// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { KachelEinstellung } from "@/lib/einstellungen";
import { ladeDashboard } from "@/lib/kacheln/laden";
import { ladeKiNewsKachel } from "@/lib/kacheln/ki-news/kachel";

vi.mock("@/lib/kacheln/ki-news/kachel", () => ({
  ladeKiNewsKachel: vi.fn(),
}));

const JETZT = new Date("2026-11-08T13:32:07Z");
const DATEN = { daten: { art: "ki-news" as const, absender: [] } };

function kachel(id: string): KachelEinstellung {
  return {
    id,
    art: "ki-news",
    titel: `Kachel ${id}`,
    aussehen: { farbe: "#8E99A8" },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("eine hängende Kachel wird nach 8 Sekunden zum Fehler, die andere bleibt", async () => {
  vi.mocked(ladeKiNewsKachel).mockImplementation(async ({ id }) =>
    id === "a" ? new Promise(() => {}) : DATEN,
  );

  const antwort = ladeDashboard([kachel("a"), kachel("b")], JETZT);
  await vi.advanceTimersByTimeAsync(8000);
  const { kacheln } = await antwort;

  expect(kacheln[0]).toEqual({
    id: "a",
    titel: "Kachel a",
    aussehen: { farbe: "#8E99A8" },
    status: "fehler",
  });
  expect(kacheln[1].status).toBe("ok");
});

test("vor 8 Sekunden gibt es keinen Fehler", async () => {
  vi.mocked(ladeKiNewsKachel).mockImplementation(
    () => new Promise((fertig) => setTimeout(() => fertig(DATEN), 7999)),
  );

  const antwort = ladeDashboard([kachel("a")], JETZT);
  await vi.advanceTimersByTimeAsync(7999);
  const { kacheln } = await antwort;

  expect(kacheln[0].status).toBe("ok");
});

test("eine schnelle Kachel lässt keinen Timer zurück", async () => {
  vi.mocked(ladeKiNewsKachel).mockResolvedValue(DATEN);

  await ladeDashboard([kachel("a")], JETZT);

  expect(vi.getTimerCount()).toBe(0);
});
