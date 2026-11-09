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
const ABRUF_ZEITLIMIT_MS = 5000;
const STUNDE_MS = 60 * 60 * 1000;

// "frisch": an jedem Speicher vorbei, solange eine Partie läuft. Sonst Speicher in Sekunden, mit dem Etikett der
// Kachel, wenn ihr Knopf ↻ ihn leeren soll (ADR 0008).
type Speicher = "frisch" | { sekunden: number; etikett?: string };

async function holeJson(
  url: string,
  speicher: Speicher,
  jetzt: Date,
): Promise<unknown> {
  const antwort = await fetch(url, {
    headers: { "User-Agent": "Tages-Dashboard" },
    signal: AbortSignal.timeout(ABRUF_ZEITLIMIT_MS),
    ...(speicher === "frisch"
      ? { cache: "no-store" as const }
      : {
          next: {
            revalidate: speicher.sekunden,
            ...(speicher.etikett && { tags: [speicher.etikett] }),
          },
        }),
  });
  if (!antwort.ok) throw new Error(`Status ${antwort.status} von ${url}`);
  if (speicher !== "frisch") {
    // Next.js liefert bei einem Ausfall still den alten Stand, die aufgehobene Date-Zeile verrät ihn (wie ADR 0005).
    const hoechstalter = Math.max(STUNDE_MS, 2 * speicher.sekunden * 1000);
    const abgerufen = Date.parse(antwort.headers.get("Date") ?? "");
    if (jetzt.getTime() - abgerufen > hoechstalter) {
      throw new Error(
        `Gespeicherte Antwort von ${antwort.headers.get("Date")}: ${url}`,
      );
    }
  }
  return antwort.json();
}

// Saison 2026/27 heißt bei OpenLigaDB 2026. Sie beginnt im Juli.
function saison(tag: string): number {
  const [jahr, monat] = tag.split("-").map(Number);
  return monat >= 7 ? jahr : jahr - 1;
}

function laeuftEine(partien: Partie[]): boolean {
  return partien.some((partie) => partie.status === "laeuft");
}

async function ladeTag(
  tag: string,
  jetzt: Date,
  etikett: string,
): Promise<Partie[]> {
  const url = `${KALENDER_URL}?dates=${tag.replaceAll("-", "")}`;
  const partien = leseTag(
    await holeJson(url, { sekunden: NORMAL_SEKUNDEN, etikett }, jetzt),
    jetzt,
  );
  if (!laeuftEine(partien)) return partien;
  return leseTag(await holeJson(url, "frisch", jetzt), jetzt);
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

export async function ladeBundesliga(
  einstellung: BundesligaEinstellung,
  jetzt: Date,
): Promise<BundesligaDaten> {
  const etikett = einstellung.id;
  const kalender = leseKalender(
    await holeJson(KALENDER_URL, { sekunden: TAG_SEKUNDEN, etikett }, jetzt),
  );
  const tage = waehleSpieltag(kalender, jetzt);
  const [partienJeTag, normaleTabelle, spielplan] = await Promise.all([
    Promise.all(tage.map((tag) => ladeTag(tag, jetzt, etikett))),
    holeJson(TABELLE_URL, { sekunden: NORMAL_SEKUNDEN, etikett }, jetzt).then(
      leseTabelle,
    ),
    ladeSpielplan(tage, jetzt),
  ]);
  const partien = partienJeTag.flat();
  const tabelle = laeuftEine(partien)
    ? leseTabelle(await holeJson(TABELLE_URL, "frisch", jetzt))
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
