// Liveticker einer Partie von ESPN (Glossar), Grundlage des Spielberichts (ADR 0013). Feld commentary laut Antworten vom 2026-11-17.
import type { FussballEinstellung } from "@/lib/einstellungen";
import { holeJson } from "@/lib/kacheln/fussball/abruf";
import { espnAdresse } from "@/lib/kacheln/fussball/espn";

type EspnEintrag = { time?: { displayValue?: string }; text?: string };

// Eine Zeile je Eintrag, z. B. "7' Goal! …". Aufstellung und Anpfiff haben keine Minute. null: kein Liveticker.
export function leseLiveticker(json: unknown): string[] | null {
  const eintraege = (json as { commentary?: EspnEintrag[] } | null)?.commentary;
  if (!Array.isArray(eintraege)) return null;
  const zeilen = eintraege
    .filter((eintrag) => eintrag.text)
    .map((eintrag) =>
      `${eintrag.time?.displayValue ?? ""} ${eintrag.text}`.trim(),
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
