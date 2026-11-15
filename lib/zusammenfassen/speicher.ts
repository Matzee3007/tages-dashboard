import type { SupabaseClient } from "@supabase/supabase-js";

export type ZusammenfassungZeile = {
  link: string;
  zusammenfassung: string;
  modell: string;
  gekuerzt: boolean;
};

const TABELLE = "zusammenfassungen";

// Die Tabelle liefert nur dem angemeldeten Besitzer Zeilen (RLS, supabase/zusammenfassungen.sql).
export async function leseZusammenfassungen(
  client: SupabaseClient,
  links: string[],
): Promise<Map<string, string>> {
  const { data, error } = await client
    .from(TABELLE)
    .select("link, zusammenfassung")
    .in("link", links);
  if (error) throw error;
  return new Map(data.map((zeile) => [zeile.link, zeile.zusammenfassung]));
}

export async function speichereZusammenfassung(
  client: SupabaseClient,
  zeile: ZusammenfassungZeile,
): Promise<void> {
  const { error } = await client
    .from(TABELLE)
    .upsert(zeile, { onConflict: "link" });
  if (error) throw error;
}
