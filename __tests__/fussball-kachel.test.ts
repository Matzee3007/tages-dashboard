// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { KACHELN, type FussballEinstellung } from "@/lib/einstellungen";
import { ladeFussballKachel } from "@/lib/kacheln/fussball/kachel";
import { ladeFussball } from "@/lib/kacheln/fussball/laden";
import type { FussballDaten, Partie } from "@/lib/kacheln/fussball/typen";
import { erstelleLeseClient } from "@/lib/supabase/server";
import { PARTIE } from "./spielbericht-beispiel";

vi.mock("@/lib/kacheln/fussball/laden", () => ({ ladeFussball: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ erstelleLeseClient: vi.fn() }));

const JETZT = new Date("2026-11-08T20:00:00Z");
const BUNDESLIGA = KACHELN.find(
  (kachel) => kachel.id === "bundesliga",
) as FussballEinstellung;

function partie(id: string, status: Partie["status"]): Partie {
  return { ...PARTIE, id, status };
}

function daten(partien: Partie[]): FussballDaten {
  return {
    art: "fussball",
    titel: "9. Spieltag",
    tage: ["2026-11-08"],
    partien,
    tabelle: null,
    meinTeam: ["132"],
    zonen: [],
  };
}

// Attrappe des Supabase-Clients: merkt sich die gefragten Partien, die Abfrage liefert, was `antwort` zurückgibt.
function client(antwort: () => Promise<unknown>) {
  const inAbfrage = vi.fn(antwort);
  const fake = { from: () => ({ select: () => ({ in: inAbfrage }) }) };
  return { client: fake as unknown as SupabaseClient, inAbfrage };
}

beforeEach(() => {
  vi.mocked(ladeFussball).mockResolvedValue(
    daten([
      partie("1", "vorbei"),
      partie("2", "vorbei"),
      partie("3", "laeuft"),
    ]),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("hängt vorhandene Spielberichte an beendete Partien", async () => {
  const db = client(async () => ({
    data: [{ partie: "1", bericht: "Leverkusen gewann." }],
    error: null,
  }));
  vi.mocked(erstelleLeseClient).mockResolvedValue(db.client);

  const { daten: geladen } = await ladeFussballKachel(BUNDESLIGA, JETZT);

  if (geladen.art !== "fussball") throw new Error("falsche Art");
  expect(geladen.partien.map((p) => p.bericht)).toEqual([
    "Leverkusen gewann.",
    undefined,
    undefined,
  ]);
});

test("fragt nur nach beendeten Partien", async () => {
  const db = client(async () => ({ data: [], error: null }));
  vi.mocked(erstelleLeseClient).mockResolvedValue(db.client);

  await ladeFussballKachel(BUNDESLIGA, JETZT);

  expect(db.inAbfrage).toHaveBeenCalledWith("partie", ["1", "2"]);
});

test("ohne beendete Partie keine Anfrage an Supabase", async () => {
  vi.mocked(ladeFussball).mockResolvedValue(daten([partie("3", "laeuft")]));
  vi.mocked(erstelleLeseClient).mockClear();

  await ladeFussballKachel(BUNDESLIGA, JETZT);

  expect(erstelleLeseClient).not.toHaveBeenCalled();
});

test("ohne Supabase lädt die Kachel trotzdem, ohne Spielberichte", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(erstelleLeseClient).mockRejectedValue(new Error("aus"));

  const { daten: geladen } = await ladeFussballKachel(BUNDESLIGA, JETZT);

  if (geladen.art !== "fussball") throw new Error("falsche Art");
  expect(geladen.partien).toHaveLength(3);
  expect(geladen.partien[0].bericht).toBeUndefined();
});

test("ein langsames Supabase bremst die Kachel höchstens 2 Sekunden", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(erstelleLeseClient).mockResolvedValue(
    client(() => new Promise(() => {})).client,
  );

  const laden = ladeFussballKachel(BUNDESLIGA, JETZT);
  await vi.advanceTimersByTimeAsync(2000);
  const { daten: geladen } = await laden;

  if (geladen.art !== "fussball") throw new Error("falsche Art");
  expect(geladen.partien[0].bericht).toBeUndefined();
});
