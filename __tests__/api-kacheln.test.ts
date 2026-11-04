// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";
import { GET } from "@/app/api/kacheln/route";
import { KACHELN } from "@/lib/einstellungen";

vi.mock("next/server", () => ({ connection: vi.fn(async () => {}) }));
vi.mock("@/lib/einstellungen", () => ({
  KACHELN: [
    { id: "test", art: "test", titel: "Testkachel", fehlerAusloesen: false },
  ],
}));

beforeEach(() => {
  KACHELN[0].fehlerAusloesen = false;
});

test("liefert die Kacheln und verbietet das Zwischenspeichern", async () => {
  const antwort = await GET();

  expect(antwort.status).toBe(200);
  expect(antwort.headers.get("Cache-Control")).toBe("no-store");
  const daten = await antwort.json();
  expect(daten.kacheln).toHaveLength(1);
  expect(daten.kacheln[0].status).toBe("ok");
});

test("eine fehlerhafte Kachel ändert den Status der Antwort nicht", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  KACHELN[0].fehlerAusloesen = true;

  const antwort = await GET();

  expect(antwort.status).toBe(200);
  const daten = await antwort.json();
  expect(daten.kacheln[0].status).toBe("fehler");
});
