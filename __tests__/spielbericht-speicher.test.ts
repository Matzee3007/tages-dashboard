// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test, vi } from "vitest";
import {
  leseSpielberichte,
  speichereSpielbericht,
} from "@/lib/spielbericht/speicher";

// Attrappe des Supabase-Clients: merkt sich Tabelle, Abfrage und jedes upsert.
function attrappe(antwort: { data: unknown; error: unknown }) {
  const inAbfrage = vi.fn().mockResolvedValue(antwort);
  const select = vi.fn(() => ({ in: inAbfrage }));
  const upsert = vi.fn().mockResolvedValue({ error: antwort.error });
  const from = vi.fn(() => ({ select, upsert }));
  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    inAbfrage,
    upsert,
  };
}

test("liest die Spielberichte der gefragten Partien", async () => {
  const db = attrappe({
    data: [{ partie: "401884738", bericht: "Leverkusen gewann." }],
    error: null,
  });

  const berichte = await leseSpielberichte(db.client, ["401884738", "1"]);

  expect(berichte).toEqual(new Map([["401884738", "Leverkusen gewann."]]));
  expect(db.from).toHaveBeenCalledWith("spielberichte");
  expect(db.select).toHaveBeenCalledWith("partie, bericht");
  expect(db.inAbfrage).toHaveBeenCalledWith("partie", ["401884738", "1"]);
});

test("ein Fehler von Supabase beim Lesen wird geworfen", async () => {
  const fehler = new Error("permission denied");
  const db = attrappe({ data: null, error: fehler });

  await expect(leseSpielberichte(db.client, ["1"])).rejects.toBe(fehler);
});

test("speichert einen Spielbericht, ein zweites Mal überschreibt ihn", async () => {
  const db = attrappe({ data: null, error: null });
  const zeile = {
    partie: "401884738",
    wettbewerb: "bundesliga",
    bericht: "Leverkusen gewann.",
    modell: "ai/gemma4:e4b",
  };

  await speichereSpielbericht(db.client, zeile);

  expect(db.upsert).toHaveBeenCalledWith(zeile, { onConflict: "partie" });
});
