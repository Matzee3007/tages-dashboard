// Liveticker einer Partie von ESPN (Glossar), Grundlage des Spielberichts (ADR 0013). Nur die wichtigen Einträge (keyEvents) ohne
// Wechsel: Der ganze Liveticker (commentary, rund 8.700 Zeichen) überforderte qwen3:4b (Evaluation vom 2026-11-17).
import type { FussballEinstellung } from "@/lib/einstellungen";
import { holeJson } from "@/lib/kacheln/fussball/abruf";
import { espnAdresse } from "@/lib/kacheln/fussball/espn";

type EspnEintrag = {
  clock?: { displayValue?: string };
  type?: { text?: string };
  text?: string;
};

// Eine Zeile je Eintrag, z. B. "7' Goal! …". Einträge ohne Text (Anpfiff) entfallen. null: kein Liveticker.
export function leseLiveticker(json: unknown): string[] | null {
  const eintraege = (json as { keyEvents?: EspnEintrag[] } | null)?.keyEvents;
  if (!Array.isArray(eintraege)) return null;
  const zeilen = eintraege
    .filter((eintrag) => eintrag.text && eintrag.type?.text !== "Substitution")
    .map((eintrag) =>
      `${eintrag.clock?.displayValue ?? ""} ${eintrag.text}`.trim(),
    );
  return zeilen.length ? zeilen : null;
}

// Ohne Speicher: Der Mac fragt je beendeter Partie nur, bis ein Spielbericht gespeichert ist.
export async function ladeLiveticker(
  liga: FussballEinstellung["espn"],
  partie: string,
  jetzt: Date,
): Promise<string[] | null> {
  const url = `${espnAdresse("summary", liga)}?event=${partie}`;
  return leseLiveticker(await holeJson(url, "frisch", jetzt));
}
