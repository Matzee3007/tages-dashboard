import type { FussballEinstellung } from "@/lib/einstellungen";
import {
  holeJson,
  NORMAL_SEKUNDEN,
  TAG_SEKUNDEN,
} from "@/lib/kacheln/fussball/abruf";
import { espnAdresse, leseTabelle } from "@/lib/kacheln/fussball/espn";
import {
  leseFdSpielplan,
  leseFdTabelle,
} from "@/lib/kacheln/fussball/football-data";
import { leseSpielplan } from "@/lib/kacheln/fussball/spielplan";
import type { TabellenZeile } from "@/lib/kacheln/fussball/typen";

// Die beiden Nahtstellen einer Liga: Spielplan (Nummer des Spieltags) und Tabelle, je nach Quelle aus der Einstellung.

const FOOTBALL_DATA = "https://api.football-data.org/v4/competitions";

// Saison 2026/27 heißt bei OpenLigaDB 2026. Sie beginnt im Juli.
function saison(tag: string): number {
  const [jahr, monat] = tag.split("-").map(Number);
  return monat >= 7 ? jahr : jahr - 1;
}

// Der Schlüssel bleibt auf dem Server (ADR 0011). Fehlt er, gibt es keinen Abruf.
function fdHeader(): Record<string, string> {
  const schluessel = process.env.FOOTBALL_DATA_API_KEY;
  if (!schluessel) throw new Error("FOOTBALL_DATA_API_KEY fehlt");
  return { "X-Auth-Token": schluessel };
}

// Ohne Etikett: Der Spielplan ändert sich selten, ↻ soll ihn nicht jedes Mal neu laden.
// Ohne Spielplan fehlt nur die Nummer des Spieltags, die Kachel läuft weiter.
// kalender: alle Tage mit Spielen von ESPN, der erste bestimmt die Saison.
export async function ladeSpielplan(
  einstellung: FussballEinstellung,
  kalender: string[],
  jetzt: Date,
): Promise<Map<string, number> | null> {
  if (kalender.length === 0) return null;
  const quelle = einstellung.spielplan;
  const speicher = { sekunden: TAG_SEKUNDEN };
  try {
    if (quelle.art === "openligadb") {
      const url = `https://api.openligadb.de/getmatchdata/${quelle.liga}/${saison(kalender[0])}`;
      return leseSpielplan(await holeJson(url, speicher, jetzt));
    }
    const url = `${FOOTBALL_DATA}/${quelle.wettbewerb}/matches`;
    return leseFdSpielplan(await holeJson(url, speicher, jetzt, fdHeader()));
  } catch (fehler) {
    const name =
      quelle.art === "openligadb" ? "OpenLigaDB" : "football-data.org";
    console.error(`Spielplan von ${name} ließ sich nicht laden:`, fehler);
    return null;
  }
}

// ESPN: frisch auf Wunsch, ein Fehler lässt die Kachel scheitern (wie bisher).
// football-data.org: frisch zählt nicht (10 Abrufe pro Minute), bei einem Fehler null, die Partien laufen weiter.
export async function ladeTabelle(
  einstellung: FussballEinstellung,
  frisch: boolean,
  jetzt: Date,
): Promise<TabellenZeile[] | null> {
  const { tabelle: quelle, teams, id: etikett } = einstellung;
  const speicher = { sekunden: NORMAL_SEKUNDEN, etikett };
  if (quelle.art === "espn") {
    const url = espnAdresse("standings", einstellung.espn);
    return leseTabelle(
      await holeJson(url, frisch ? "frisch" : speicher, jetzt),
      teams,
    );
  }
  try {
    const url = `${FOOTBALL_DATA}/${quelle.wettbewerb}/standings`;
    return leseFdTabelle(
      await holeJson(url, speicher, jetzt, fdHeader()),
      teams,
    );
  } catch (fehler) {
    console.error(
      "Tabelle von football-data.org ließ sich nicht laden:",
      fehler,
    );
    return null;
  }
}
