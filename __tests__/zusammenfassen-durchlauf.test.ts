// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ladeKiNews } from "@/lib/kacheln/ki-news/laden";
import { ladeArtikel } from "@/lib/zusammenfassen/artikel";
import { durchlauf } from "@/lib/zusammenfassen/durchlauf";
import { fasseZusammen } from "@/lib/zusammenfassen/modell";

vi.mock("@/lib/kacheln/ki-news/laden", () => ({ ladeKiNews: vi.fn() }));
vi.mock("@/lib/zusammenfassen/artikel", () => ({ ladeArtikel: vi.fn() }));
vi.mock("@/lib/zusammenfassen/modell", () => ({ fasseZusammen: vi.fn() }));

const JETZT = new Date("2026-11-15T12:00:00Z");
const MODELL = { url: "http://modell/v1/", name: "ai/test" };
const ARTIKEL = { text: "Artikeltext", gekuerzt: false };

function meldung(nummer: number) {
  return {
    titel: `Titel ${nummer}`,
    link: `https://example.org/${nummer}`,
    zeit: "2026-11-15T10:00:00.000Z",
  };
}

// Attrappe des Supabase-Clients: liefert die schon gespeicherten Zeilen und merkt sich jedes upsert.
function client(gespeichert: { link: string; zusammenfassung: string }[]) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const fake = {
    from: () => ({
      select: () => ({
        in: async () => ({ data: gespeichert, error: null }),
      }),
      upsert,
    }),
  };
  return { client: fake as unknown as SupabaseClient, upsert };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ladeKiNews).mockResolvedValue([
    {
      name: "Anthropic",
      meldungen: [meldung(1), meldung(2), meldung(3)],
      letzteMeldung: "2026-11-15T10:00:00.000Z",
      erreichbar: true,
    },
  ]);
  vi.mocked(ladeArtikel).mockResolvedValue(ARTIKEL);
  vi.mocked(fasseZusammen).mockResolvedValue("Eins. Zwei.");
});

test("fasst nur Meldungen ohne Zusammenfassung zusammen", async () => {
  const { client: supabase, upsert } = client([
    { link: "https://example.org/2", zusammenfassung: "Schon da." },
  ]);

  const ergebnis = await durchlauf(supabase, MODELL, JETZT);

  expect(ergebnis).toEqual({ neu: 2, ohne: 0 });
  expect(fasseZusammen).toHaveBeenCalledTimes(2);
  expect(fasseZusammen).toHaveBeenCalledWith(ARTIKEL, "Titel 1", MODELL);
  expect(upsert).toHaveBeenCalledWith(
    {
      link: "https://example.org/1",
      zusammenfassung: "Eins. Zwei.",
      modell: "ai/test",
      gekuerzt: false,
    },
    { onConflict: "link" },
  );
});

test("Meldung ohne Artikel wird übersprungen", async () => {
  vi.mocked(ladeArtikel).mockResolvedValue(null);
  const { client: supabase, upsert } = client([]);

  const ergebnis = await durchlauf(supabase, MODELL, JETZT);

  expect(ergebnis).toEqual({ neu: 0, ohne: 3 });
  expect(fasseZusammen).not.toHaveBeenCalled();
  expect(upsert).not.toHaveBeenCalled();
});

test("verworfene Antwort wird nicht gespeichert", async () => {
  vi.mocked(fasseZusammen).mockResolvedValue(null);
  const { client: supabase, upsert } = client([]);

  const ergebnis = await durchlauf(supabase, MODELL, JETZT);

  expect(ergebnis).toEqual({ neu: 0, ohne: 3 });
  expect(upsert).not.toHaveBeenCalled();
});

test("Modell nicht erreichbar bricht den Durchlauf ab", async () => {
  vi.mocked(fasseZusammen).mockRejectedValue(new TypeError("fetch failed"));
  const { client: supabase, upsert } = client([]);

  await expect(durchlauf(supabase, MODELL, JETZT)).rejects.toThrow(
    "fetch failed",
  );
  expect(upsert).not.toHaveBeenCalled();
});

test("ein Zeitlimit des Modells betrifft nur diesen Artikel", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(fasseZusammen).mockRejectedValueOnce(
    new DOMException("timeout", "TimeoutError"),
  );
  const { client: supabase, upsert } = client([]);

  const ergebnis = await durchlauf(supabase, MODELL, JETZT);

  expect(ergebnis).toEqual({ neu: 2, ohne: 1 });
  expect(upsert).toHaveBeenCalledTimes(2);
});

test("ein Fehler beim Speichern betrifft nur diesen Artikel", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { client: supabase, upsert } = client([]);
  upsert.mockResolvedValueOnce({ error: { message: "kurz weg" } });

  const ergebnis = await durchlauf(supabase, MODELL, JETZT);

  expect(ergebnis).toEqual({ neu: 2, ohne: 1 });
  expect(upsert).toHaveBeenCalledTimes(3);
});

afterEach(() => {
  vi.restoreAllMocks();
});
