import type { NflEinstellung } from "@/lib/einstellungen";
import {
  holeJson,
  NORMAL_SEKUNDEN,
  TAG_SEKUNDEN,
  type Speicher,
} from "@/lib/kacheln/fussball/abruf";
import {
  sortierePartien,
  spieltagTag,
  tabellenAusschnitt,
} from "@/lib/kacheln/fussball/spieltag";
import type { Partie, TeamStand } from "@/lib/kacheln/fussball/typen";
import {
  leseScoringPlays,
  leseTabellen,
  leseWoche,
  leseWochen,
  NFL_ADRESSEN,
} from "@/lib/kacheln/nfl/espn";
import type { NflDaten } from "@/lib/kacheln/nfl/typen";
import { waehleWoche } from "@/lib/kacheln/nfl/woche";
import { heute } from "@/lib/zeit";

type WochenStand = { partien: Partie[]; spielfrei: TeamStand[] };

const laeuftEine = (partien: Partie[]) =>
  partien.some((partie) => partie.status === "laeuft");

const tageVon = (partien: Partie[]) =>
  [...new Set(partien.map(spieltagTag))].sort();

// Wie beim Fußball: erst aus dem Speicher, läuft eine Partie, frisch nachholen.
async function ladeWoche(
  nummer: number,
  etikett: string,
  jetzt: Date,
): Promise<WochenStand> {
  const url = NFL_ADRESSEN.woche(nummer);
  const stand = leseWoche(
    await holeJson(url, { sekunden: NORMAL_SEKUNDEN, etikett }, jetzt),
    jetzt,
  );
  if (!laeuftEine(stand.partien)) return stand;
  return leseWoche(await holeJson(url, "frisch", jetzt), jetzt);
}

// Die Woche nach der Regel aller Wettbewerbe. Die Vorwoche wird nur geladen, wenn heute vor dem ersten Spiel liegt.
async function ladeGewaehlteWoche(
  einstellung: NflEinstellung,
  jetzt: Date,
): Promise<{ nummer: number; stand: WochenStand }> {
  const wochen = leseWochen(
    await holeJson(
      NFL_ADRESSEN.kalender,
      { sekunden: TAG_SEKUNDEN, etikett: einstellung.id },
      jetzt,
    ),
  );
  const geladen = new Map<number, WochenStand>();
  const imKalender = waehleWoche(wochen, () => undefined, jetzt);
  geladen.set(imKalender, await ladeWoche(imKalender, einstellung.id, jetzt));
  const ersterTag = tageVon(geladen.get(imKalender)!.partien)[0];
  if (imKalender > 1 && ersterTag !== undefined && heute(jetzt) < ersterTag) {
    geladen.set(
      imKalender - 1,
      await ladeWoche(imKalender - 1, einstellung.id, jetzt),
    );
  }
  const nummer = waehleWoche(
    wochen,
    (woche) => {
      const stand = geladen.get(woche);
      return stand && tageVon(stand.partien);
    },
    jetzt,
  );
  return { nummer, stand: geladen.get(nummer)! };
}

// Scoring-Plays nur bei laufenden Partien und bei Mein Team (Entscheidung vom 2026-11-25). Ein Fehler trifft nur diese Partie.
async function mitPlays(
  partie: Partie,
  meinTeam: string[],
  jetzt: Date,
): Promise<Partie> {
  const mein =
    meinTeam.includes(partie.heim.id) || meinTeam.includes(partie.gast.id);
  const angepfiffen = partie.status === "laeuft" || partie.status === "vorbei";
  if (!angepfiffen || (partie.status !== "laeuft" && !mein)) return partie;
  const speicher: Speicher =
    partie.status === "laeuft" ? "frisch" : { sekunden: TAG_SEKUNDEN };
  try {
    const json = await holeJson(NFL_ADRESSEN.plays(partie.id), speicher, jetzt);
    return {
      ...partie,
      tore: leseScoringPlays(json, partie.heim.id, partie.gast.id),
    };
  } catch (fehler) {
    console.error(`Scoring-Plays ${partie.id} fehlen:`, fehler);
    return partie;
  }
}

async function ladeTabellen(
  einstellung: NflEinstellung,
  frisch: boolean,
  jetzt: Date,
): Promise<Pick<NflDaten, "division" | "conference">> {
  try {
    const { division, conference } = leseTabellen(
      await holeJson(
        NFL_ADRESSEN.tabelle,
        frisch
          ? "frisch"
          : { sekunden: NORMAL_SEKUNDEN, etikett: einstellung.id },
        jetzt,
      ),
      einstellung.division,
      einstellung.conference,
    );
    return {
      division,
      conference: tabellenAusschnitt(conference, einstellung.meinTeam),
    };
  } catch (fehler) {
    console.error("Tabelle der NFL fehlt:", fehler);
    return { division: null, conference: null };
  }
}

export async function ladeNfl(
  einstellung: NflEinstellung,
  jetzt: Date,
): Promise<NflDaten> {
  const { nummer, stand } = await ladeGewaehlteWoche(einstellung, jetzt);
  const [partien, tabellen] = await Promise.all([
    Promise.all(
      stand.partien.map((partie) =>
        mitPlays(partie, einstellung.meinTeam, jetzt),
      ),
    ),
    ladeTabellen(einstellung, laeuftEine(stand.partien), jetzt),
  ]);
  return {
    art: "nfl",
    titel: `Woche ${nummer}`,
    tage: tageVon(partien),
    partien: sortierePartien(partien, einstellung.meinTeam),
    spielfrei: stand.spielfrei,
    ...tabellen,
    meinTeam: einstellung.meinTeam,
    zonen: einstellung.zonen,
  };
}
