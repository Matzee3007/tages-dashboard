// @vitest-environment node
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, expect, test, vi } from "vitest";
import { ladeSpieltag } from "@/lib/kacheln/fussball/laden";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { durchlaufSpielberichte } from "@/lib/spielbericht/durchlauf";
import { ladeLiveticker } from "@/lib/spielbericht/liveticker";
import { schreibeBericht } from "@/lib/spielbericht/modell";
import { PARTIE } from "./spielbericht-beispiel";

vi.mock("@/lib/kacheln/fussball/laden", () => ({ ladeSpieltag: vi.fn() }));
vi.mock("@/lib/spielbericht/liveticker", () => ({ ladeLiveticker: vi.fn() }));
vi.mock("@/lib/spielbericht/modell", () => ({ schreibeBericht: vi.fn() }));

const JETZT = new Date("2026-11-08T20:00:00Z");
const MODELL = { url: "http://modell/v1/", name: "ai/test" };
const TICKER = ["7' Goal!"];

function partie(id: string, status: Partie["status"]): Partie {
  return { ...PARTIE, id, status };
}

// Spieltag je Kachel. Nicht genannte Kacheln haben keine Partien.
function spieltage(jeKachel: Record<string, Partie[]>) {
  vi.mocked(ladeSpieltag).mockImplementation(async (einstellung) => ({
    spielplan: null,
    tage: ["2026-11-08"],
    partien: jeKachel[einstellung.id] ?? [],
  }));
}

// Attrappe des Supabase-Clients: liefert die schon gespeicherten Berichte und merkt sich jedes upsert.
function client(gespeichert: string[] = []) {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const fake = {
    from: () => ({
      select: () => ({
        in: async () => ({
          data: gespeichert.map((id) => ({ partie: id, bericht: "Da." })),
          error: null,
        }),
      }),
      upsert,
    }),
  };
  return { client: fake as unknown as SupabaseClient, upsert };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ladeLiveticker).mockResolvedValue(TICKER);
  vi.mocked(schreibeBericht).mockResolvedValue("Ein Bericht.");
});

test("schreibt nur für beendete Partien ohne Spielbericht", async () => {
  spieltage({
    bundesliga: [
      partie("1", "vorher"),
      partie("2", "laeuft"),
      partie("3", "vorbei"),
      partie("4", "vorbei"),
    ],
  });
  const { client: supabase } = client(["3"]);

  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 1,
    ohne: 0,
  });
  expect(ladeLiveticker).toHaveBeenCalledTimes(1);
  expect(ladeLiveticker).toHaveBeenCalledWith("ger.1", "4", JETZT);
});

test("speichert mit id der Kachel und Modellname", async () => {
  spieltage({ "premier-league": [partie("7", "vorbei")] });
  const { client: supabase, upsert } = client();

  await durchlaufSpielberichte(supabase, MODELL, JETZT);

  expect(schreibeBericht).toHaveBeenCalledWith(
    partie("7", "vorbei"),
    TICKER,
    MODELL,
  );
  expect(upsert).toHaveBeenCalledWith(
    {
      partie: "7",
      wettbewerb: "premier-league",
      bericht: "Ein Bericht.",
      modell: "ai/test",
    },
    { onConflict: "partie" },
  );
});

test("ohne Liveticker wird das Modell nicht gefragt", async () => {
  spieltage({ bundesliga: [partie("4", "vorbei")] });
  vi.mocked(ladeLiveticker).mockResolvedValue(null);
  const { client: supabase, upsert } = client();

  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 0,
    ohne: 1,
  });
  expect(schreibeBericht).not.toHaveBeenCalled();
  expect(upsert).not.toHaveBeenCalled();
});

test("verworfener Spielbericht wird nicht gespeichert", async () => {
  spieltage({ bundesliga: [partie("4", "vorbei")] });
  vi.mocked(schreibeBericht).mockResolvedValue(null);
  const { client: supabase, upsert } = client();

  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 0,
    ohne: 1,
  });
  expect(upsert).not.toHaveBeenCalled();
});

test("ein Fehler bei einer Partie stoppt die anderen nicht", async () => {
  spieltage({ bundesliga: [partie("4", "vorbei"), partie("5", "vorbei")] });
  vi.mocked(ladeLiveticker).mockRejectedValueOnce(new Error("Status 500"));
  const { client: supabase } = client();

  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 1,
    ohne: 1,
  });
});

test("ein Fehler beim Spieltag einer Kachel stoppt die anderen nicht", async () => {
  vi.mocked(ladeSpieltag).mockImplementation(async (einstellung) => {
    if (einstellung.id === "bundesliga") throw new Error("ESPN aus");
    return { spielplan: null, tage: [], partien: [partie("7", "vorbei")] };
  });
  const { client: supabase } = client();

  // Premier League und Champions League liefern je eine beendete Partie.
  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 2,
    ohne: 0,
  });
});

test("ist das Modell nicht erreichbar, bricht der Durchlauf ab", async () => {
  spieltage({ bundesliga: [partie("4", "vorbei"), partie("5", "vorbei")] });
  vi.mocked(schreibeBericht).mockRejectedValue(new TypeError("fetch failed"));
  const { client: supabase } = client();

  await expect(durchlaufSpielberichte(supabase, MODELL, JETZT)).rejects.toThrow(
    TypeError,
  );
  expect(schreibeBericht).toHaveBeenCalledTimes(1);
});

test("ein Netzfehler beim Liveticker betrifft nur diese Partie (Review von PR #85)", async () => {
  spieltage({ bundesliga: [partie("4", "vorbei"), partie("5", "vorbei")] });
  vi.mocked(ladeLiveticker).mockRejectedValueOnce(
    new TypeError("fetch failed"),
  );
  const { client: supabase } = client();

  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 1,
    ohne: 1,
  });
});

test("ein Fehler beim Lesen aus Supabase überspringt nur diesen Wettbewerb (Review von PR #85)", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  spieltage({
    bundesliga: [partie("4", "vorbei")],
    "premier-league": [partie("7", "vorbei")],
  });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const inAbfrage = vi
    .fn()
    .mockResolvedValueOnce({ data: null, error: new Error("Zeitlimit") })
    .mockResolvedValue({ data: [], error: null });
  const supabase = {
    from: () => ({ select: () => ({ in: inAbfrage }), upsert }),
  } as unknown as SupabaseClient;

  expect(await durchlaufSpielberichte(supabase, MODELL, JETZT)).toEqual({
    neu: 1,
    ohne: 0,
  });
  expect(upsert).toHaveBeenCalledWith(
    expect.objectContaining({ partie: "7" }),
    { onConflict: "partie" },
  );
});
