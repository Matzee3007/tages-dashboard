import type { LigaEinstellung } from "@/lib/einstellungen";
import { holeJson } from "@/lib/kacheln/liga/abruf";
import { leseKalender, leseTabelle, leseTag } from "@/lib/kacheln/liga/espn";
import { leseSpielplan } from "@/lib/kacheln/liga/spielplan";
import {
  sortierePartien,
  spieltagTitel,
  tabellenAusschnitt,
  waehleSpieltag,
} from "@/lib/kacheln/liga/spieltag";
import type { LigaDaten, Partie } from "@/lib/kacheln/liga/typen";

const ESPN = "https://site.api.espn.com/apis";
const kalenderUrl = (liga: string) =>
  `${ESPN}/site/v2/sports/soccer/${liga}/scoreboard`;
const tabelleUrl = (liga: string) =>
  `${ESPN}/v2/sports/soccer/${liga}/standings`;

// Speicher in Sekunden (Projektvision, Entscheidungen vom 2026-11-08).
const TAG_SEKUNDEN = 86_400;
const NORMAL_SEKUNDEN = 900;

// Saison 2026/27 heißt bei OpenLigaDB 2026. Sie beginnt im Juli.
function saison(tag: string): number {
  const [jahr, monat] = tag.split("-").map(Number);
  return monat >= 7 ? jahr : jahr - 1;
}

function laeuftEine(partien: Partie[]): boolean {
  return partien.some((partie) => partie.status === "laeuft");
}

async function ladeTag(
  einstellung: LigaEinstellung,
  tag: string,
  jetzt: Date,
): Promise<Partie[]> {
  const url = `${kalenderUrl(einstellung.espn)}?dates=${tag.replaceAll("-", "")}`;
  const etikett = einstellung.id;
  const partien = leseTag(
    await holeJson(url, { sekunden: NORMAL_SEKUNDEN, etikett }, jetzt),
    jetzt,
    einstellung.teams,
  );
  if (!laeuftEine(partien)) return partien;
  return leseTag(
    await holeJson(url, "frisch", jetzt),
    jetzt,
    einstellung.teams,
  );
}

// Ohne Etikett: Der Spielplan ändert sich selten, ↻ soll ihn nicht jedes Mal neu laden.
async function ladeSpielplan(
  tage: string[],
  jetzt: Date,
): Promise<Map<string, number> | null> {
  if (tage.length === 0) return null;
  const url = `https://api.openligadb.de/getmatchdata/bl1/${saison(tage[0])}`;
  // Ohne Spielplan fehlt nur die Nummer des Spieltags, die Kachel läuft weiter.
  try {
    return leseSpielplan(
      await holeJson(url, { sekunden: TAG_SEKUNDEN }, jetzt),
    );
  } catch (fehler) {
    console.error("Spielplan von OpenLigaDB ließ sich nicht laden:", fehler);
    return null;
  }
}

export async function ladeLiga(
  einstellung: LigaEinstellung,
  jetzt: Date,
): Promise<LigaDaten> {
  const etikett = einstellung.id;
  const { espn, teams, meinTeam } = einstellung;
  const kalender = leseKalender(
    await holeJson(
      kalenderUrl(espn),
      { sekunden: TAG_SEKUNDEN, etikett },
      jetzt,
    ),
  );
  const tage = waehleSpieltag(kalender, jetzt);
  const [partienJeTag, normaleTabelle, spielplan] = await Promise.all([
    Promise.all(tage.map((tag) => ladeTag(einstellung, tag, jetzt))),
    holeJson(
      tabelleUrl(espn),
      { sekunden: NORMAL_SEKUNDEN, etikett },
      jetzt,
    ).then((json) => leseTabelle(json, teams)),
    ladeSpielplan(tage, jetzt),
  ]);
  const partien = partienJeTag.flat();
  const tabelle = laeuftEine(partien)
    ? leseTabelle(await holeJson(tabelleUrl(espn), "frisch", jetzt), teams)
    : normaleTabelle;

  return {
    art: "liga",
    titel: spieltagTitel(tage, spielplan),
    tage,
    partien: sortierePartien(partien, meinTeam),
    tabelle: tabellenAusschnitt(tabelle, meinTeam),
    meinTeam,
  };
}
