// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { KachelEinstellung } from "@/lib/einstellungen";
import { ladeDashboard } from "@/lib/kacheln/laden";
import { ladeTestkachel } from "@/lib/kacheln/test/laden";

vi.mock("@/lib/kacheln/test/laden", () => ({ ladeTestkachel: vi.fn() }));

const JETZT = new Date("2026-11-08T13:32:07Z");
const DATEN = { daten: { art: "test" as const, uhrzeit: "14:32:07" } };

function kachel(id: string): KachelEinstellung {
  return { id, art: "test", titel: `Kachel ${id}`, fehlerAusloesen: false };
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
  vi.mocked(ladeTestkachel).mockImplementation(async ({ id }) =>
    id === "a" ? new Promise(() => {}) : DATEN,
  );

  const antwort = ladeDashboard([kachel("a"), kachel("b")], JETZT);
  await vi.advanceTimersByTimeAsync(8000);
  const { kacheln } = await antwort;

  expect(kacheln[0]).toEqual({ id: "a", titel: "Kachel a", status: "fehler" });
  expect(kacheln[1].status).toBe("ok");
});

test("vor 8 Sekunden gibt es keinen Fehler", async () => {
  vi.mocked(ladeTestkachel).mockImplementation(
    () => new Promise((fertig) => setTimeout(() => fertig(DATEN), 7999)),
  );

  const antwort = ladeDashboard([kachel("a")], JETZT);
  await vi.advanceTimersByTimeAsync(7999);
  const { kacheln } = await antwort;

  expect(kacheln[0].status).toBe("ok");
});

test("eine schnelle Kachel lässt keinen Timer zurück", async () => {
  vi.mocked(ladeTestkachel).mockResolvedValue(DATEN);

  await ladeDashboard([kachel("a")], JETZT);

  expect(vi.getTimerCount()).toBe(0);
});
