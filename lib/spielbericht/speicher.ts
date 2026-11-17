import type { SupabaseClient } from "@supabase/supabase-js";

// partie: id der Partie bei ESPN. wettbewerb: id der Kachel, z. B. "bundesliga".
export type SpielberichtZeile = {
  partie: string;
  wettbewerb: string;
  bericht: string;
  modell: string;
};

const TABELLE = "spielberichte";

// Die Tabelle liefert nur dem angemeldeten Besitzer Zeilen (RLS, supabase/spielberichte.sql).
export async function leseSpielberichte(
  client: SupabaseClient,
  partien: string[],
): Promise<Map<string, string>> {
  const { data, error } = await client
    .from(TABELLE)
    .select("partie, bericht")
    .in("partie", partien);
  if (error) throw error;
  return new Map(data.map((zeile) => [zeile.partie, zeile.bericht]));
}

export async function speichereSpielbericht(
  client: SupabaseClient,
  zeile: SpielberichtZeile,
): Promise<void> {
  const { error } = await client
    .from(TABELLE)
    .upsert(zeile, { onConflict: "partie" });
  if (error) throw error;
}
