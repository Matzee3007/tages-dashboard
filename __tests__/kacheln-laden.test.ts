import { afterEach, expect, test, vi } from "vitest";
import type { KachelEinstellung } from "@/lib/einstellungen";
import { ladeDashboard } from "@/lib/kacheln/laden";

const JETZT = new Date("2026-11-08T13:32:07Z");

function testkachel(id: string, fehlerAusloesen: boolean): KachelEinstellung {
  return { id, art: "test", titel: `Kachel ${id}`, fehlerAusloesen };
}

afterEach(() => {
  vi.restoreAllMocks();
});

test("eine fehlerhafte Kachel stört die andere nicht, die Reihenfolge bleibt", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  const antwort = await ladeDashboard(
    [testkachel("a", true), testkachel("b", false)],
    JETZT,
  );

  expect(antwort.zeit).toBe("2026-11-08T13:32:07.000Z");
  expect(antwort.kacheln).toEqual([
    { id: "a", titel: "Kachel a", status: "fehler" },
    {
      id: "b",
      titel: "Kachel b",
      status: "ok",
      zusatz: "Server",
      daten: { art: "test", uhrzeit: "14:32:07" },
      stand: "2026-11-08T13:32:07.000Z",
    },
  ]);
});

test("der Fehlertext bleibt auf dem Server", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});

  const antwort = await ladeDashboard([testkachel("a", true)], JETZT);

  const text = JSON.stringify(antwort);
  expect(text).not.toContain("Testfehler");
  expect(text).not.toContain("stack");
  expect(log).toHaveBeenCalled();
});
