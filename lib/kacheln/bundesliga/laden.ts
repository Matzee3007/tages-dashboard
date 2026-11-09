import type { BundesligaEinstellung } from "@/lib/einstellungen";
import {
  leseKalender,
  leseTabelle,
  leseTag,
} from "@/lib/kacheln/bundesliga/espn";
import { leseSpielplan } from "@/lib/kacheln/bundesliga/spielplan";
import {
  sortierePartien,
  spieltagTitel,
  tabellenAusschnitt,
  waehleSpieltag,
} from "@/lib/kacheln/bundesliga/spieltag";
import type { BundesligaDaten, Partie } from "@/lib/kacheln/bundesliga/typen";

const ESPN = "https://site.api.espn.com/apis";
const KALENDER_URL = `${ESPN}/site/v2/sports/soccer/ger.1/scoreboard`;
const TABELLE_URL = `${ESPN}/v2/sports/soccer/ger.1/standings`;

// Speicher in Sekunden (Projektvision, Entscheidungen vom 2026-11-08).
const TAG_SEKUNDEN = 86_400;
const NORMAL_SEKUNDEN = 900;
const LIVE_SEKUNDEN = 60;
const ABRUF_ZEITLIMIT_MS = 5000;

async function holeJson(
  url: string,
  revalidate: number,
  etikett: string,
): Promise<unknown> {
  const antwort = await fetch(url, {
    headers: { "User-Agent": "Tages-Dashboard" },
    // Das Etikett ist die id der Kachel: Ihr Knopf ↻ leert damit den Speicher (ADR 0008).
    next: { revalidate, tags: [etikett] },
    signal: AbortSignal.timeout(ABRUF_ZEITLIMIT_MS),
  });
  if (!antwort.ok) throw new Error(`Status ${antwort.status} von ${url}`);
  return antwort.json();
}

// Saison 2026/27 heißt bei OpenLigaDB 2026. Sie beginnt im Juli.
function saison(tag: string): number {
  const [jahr, monat] = tag.split("-").map(Number);
  return monat >= 7 ? jahr : jahr - 1;
}

async function ladeTag(
  tag: string,
  jetzt: Date,
  etikett: string,
): Promise<Partie[]> {
  const url = `${KALENDER_URL}?dates=${tag.replaceAll("-", "")}`;
  const partien = leseTag(await holeJson(url, NORMAL_SEKUNDEN, etikett), jetzt);
  if (!laeuftEine(partien)) return partien;
  // Next.js misst das Alter mit dem revalidate des Aufrufs: Derselbe Eintrag gilt jetzt nach 60 s als alt.
  return leseTag(await holeJson(url, LIVE_SEKUNDEN, etikett), jetzt);
}

function laeuftEine(partien: Partie[]): boolean {
  return partien.some((partie) => partie.status === "laeuft");
}

async function ladeSpielplan(
  tage: string[],
  etikett: string,
): Promise<Map<string, number> | null> {
  if (tage.length === 0) return null;
  const url = `https://api.openligadb.de/getmatchdata/bl1/${saison(tage[0])}`;
  // Ohne Spielplan fehlt nur die Nummer des Spieltags, die Kachel läuft weiter.
  try {
    return leseSpielplan(await holeJson(url, TAG_SEKUNDEN, etikett));
  } catch (fehler) {
    console.error("Spielplan von OpenLigaDB ließ sich nicht laden:", fehler);
    return null;
  }
}

export async function ladeBundesliga(
  einstellung: BundesligaEinstellung,
  jetzt: Date,
): Promise<BundesligaDaten> {
  const etikett = einstellung.id;
  const kalender = leseKalender(
    await holeJson(KALENDER_URL, TAG_SEKUNDEN, etikett),
  );
  const tage = waehleSpieltag(kalender, jetzt);
  const [partienJeTag, normaleTabelle, spielplan] = await Promise.all([
    Promise.all(tage.map((tag) => ladeTag(tag, jetzt, etikett))),
    holeJson(TABELLE_URL, NORMAL_SEKUNDEN, etikett).then(leseTabelle),
    ladeSpielplan(tage, etikett),
  ]);
  const partien = partienJeTag.flat();
  const tabelle = laeuftEine(partien)
    ? leseTabelle(await holeJson(TABELLE_URL, LIVE_SEKUNDEN, etikett))
    : normaleTabelle;

  return {
    art: "bundesliga",
    titel: spieltagTitel(tage, spielplan),
    tage,
    partien: sortierePartien(partien, einstellung.meinTeam),
    tabelle: tabellenAusschnitt(tabelle, einstellung.meinTeam),
    meinTeam: einstellung.meinTeam,
  };
}
