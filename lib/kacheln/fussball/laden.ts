import type { FussballEinstellung } from "@/lib/einstellungen";
import {
  holeJson,
  NORMAL_SEKUNDEN,
  TAG_SEKUNDEN,
} from "@/lib/kacheln/fussball/abruf";
import {
  espnAdresse,
  leseKalender,
  leseTag,
} from "@/lib/kacheln/fussball/espn";
import { ladeSpielplan, ladeTabelle } from "@/lib/kacheln/fussball/quellen";
import {
  sortierePartien,
  spieltagTitel,
  tabellenAusschnitt,
  waehleSpieltag,
} from "@/lib/kacheln/fussball/spieltag";
import type { FussballDaten, Partie } from "@/lib/kacheln/fussball/typen";

function laeuftEine(partien: Partie[]): boolean {
  return partien.some((partie) => partie.status === "laeuft");
}

async function ladeTag(
  einstellung: FussballEinstellung,
  tag: string,
  jetzt: Date,
): Promise<Partie[]> {
  const url = `${espnAdresse("scoreboard", einstellung.espn)}?dates=${tag.replaceAll("-", "")}`;
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

// Der Spielplan kommt vor der Wahl: Steigt die Nummer, trennt er Spieltage ohne Lücke.
async function ladeSpieltag(
  einstellung: FussballEinstellung,
  kalender: string[],
  jetzt: Date,
) {
  const spielplan = await ladeSpielplan(einstellung, kalender, jetzt);
  const tage = waehleSpieltag(kalender, spielplan, jetzt);
  const partienJeTag = await Promise.all(
    tage.map((tag) => ladeTag(einstellung, tag, jetzt)),
  );
  return { spielplan, tage, partien: partienJeTag.flat() };
}

export async function ladeFussball(
  einstellung: FussballEinstellung,
  jetzt: Date,
): Promise<FussballDaten> {
  const etikett = einstellung.id;
  const kalender = leseKalender(
    await holeJson(
      espnAdresse("scoreboard", einstellung.espn),
      { sekunden: TAG_SEKUNDEN, etikett },
      jetzt,
    ),
  );
  const [{ spielplan, tage, partien }, normaleTabelle] = await Promise.all([
    ladeSpieltag(einstellung, kalender, jetzt),
    ladeTabelle(einstellung, false, jetzt),
  ]);
  // Nur ESPN wird live nachgeholt, die Tabelle von football-data.org darf nachziehen (ADR 0011).
  const tabelle =
    laeuftEine(partien) && einstellung.tabelle.art === "espn"
      ? await ladeTabelle(einstellung, true, jetzt)
      : normaleTabelle;

  return {
    art: "fussball",
    titel: spieltagTitel(tage, spielplan),
    tage,
    partien: sortierePartien(partien, einstellung.meinTeam),
    tabelle: tabelle && tabellenAusschnitt(tabelle, einstellung.meinTeam),
    meinTeam: einstellung.meinTeam,
  };
}
