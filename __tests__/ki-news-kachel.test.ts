// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ladeKiNewsKachel } from "@/lib/kacheln/ki-news/kachel";
import { ladeKiNews } from "@/lib/kacheln/ki-news/laden";
import { erstelleLeseClient } from "@/lib/supabase/server";

vi.mock("@/lib/kacheln/ki-news/laden", () => ({ ladeKiNews: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ erstelleLeseClient: vi.fn() }));

const JETZT = new Date("2026-11-15T12:00:00Z");
const EINSTELLUNG = {
  id: "ki-news",
  art: "ki-news",
  titel: "KI-News",
} as const;

// Attrappe des Supabase-Clients: Die Abfrage liefert, was `antwort` zurückgibt.
function client(antwort: () => Promise<unknown>) {
  return {
    from: () => ({ select: () => ({ in: antwort }) }),
  } as unknown as SupabaseClient;
}

beforeEach(() => {
  vi.mocked(ladeKiNews).mockResolvedValue([
    {
      name: "Anthropic",
      meldungen: [
        {
          titel: "Eins",
          link: "https://example.org/1",
          zeit: "2026-11-15T10:00:00.000Z",
        },
        {
          titel: "Zwei",
          link: "https://example.org/2",
          zeit: "2026-11-15T09:00:00.000Z",
        },
      ],
      letzteMeldung: "2026-11-15T10:00:00.000Z",
      erreichbar: true,
    },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("hängt die Zusammenfassung an die passende Meldung", async () => {
  vi.mocked(erstelleLeseClient).mockResolvedValue(
    client(async () => ({
      data: [{ link: "https://example.org/1", zusammenfassung: "Eins kurz." }],
      error: null,
    })),
  );

  const { daten } = await ladeKiNewsKachel(EINSTELLUNG, JETZT);

  if (daten.art !== "ki-news") throw new Error("falsche Art");
  const [eins, zwei] = daten.absender[0].meldungen;
  expect(eins.zusammenfassung).toBe("Eins kurz.");
  expect(zwei.zusammenfassung).toBeUndefined();
});

test("ohne Tabelle lädt die Kachel trotzdem", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(erstelleLeseClient).mockResolvedValue(
    client(async () => ({ data: null, error: new Error("relation missing") })),
  );

  const { daten } = await ladeKiNewsKachel(EINSTELLUNG, JETZT);

  if (daten.art !== "ki-news") throw new Error("falsche Art");
  expect(daten.absender[0].meldungen.map((m) => m.titel)).toEqual([
    "Eins",
    "Zwei",
  ]);
  expect(daten.absender[0].meldungen[0].zusammenfassung).toBeUndefined();
});

test("ein langsames Supabase bremst die Kachel höchstens 3 Sekunden", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(erstelleLeseClient).mockResolvedValue(
    client(() => new Promise(() => {})),
  );

  const laden = ladeKiNewsKachel(EINSTELLUNG, JETZT);
  await vi.advanceTimersByTimeAsync(3000);
  const { daten } = await laden;

  if (daten.art !== "ki-news") throw new Error("falsche Art");
  expect(daten.absender[0].meldungen).toHaveLength(2);
  expect(daten.absender[0].meldungen[0].zusammenfassung).toBeUndefined();
});
