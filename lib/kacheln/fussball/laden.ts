import type { FussballEinstellung } from "@/lib/einstellungen";
import {
  holeJson,
  NORMAL_SEKUNDEN,
  TAG_SEKUNDEN,
} from "@/lib/kacheln/fussball/abruf";
import {
  espnAdresse,
  leseKalender,
  leseTageDerPartien,
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

// Tage mit Spielen und Spielplan. Bei der Champions League sind die Tage die des Spielplans (Einstellung kalender).
// Fehlt er oder ist leer, nimmt sie die Tage aus dem Standardabruf von ESPN (aktueller oder nächster Tag), ohne Nummer (ADR 0011).
async function ladeKalender(einstellung: FussballEinstellung, jetzt: Date) {
  if (einstellung.kalender.art === "spielplan") {
    const spielplan = await ladeSpielplan(einstellung, [], jetzt);
    if (spielplan?.size)
      return { kalender: [...spielplan.keys()].sort(), spielplan };
    const ersatz = await holeJson(
      espnAdresse("scoreboard", einstellung.espn),
      { sekunden: NORMAL_SEKUNDEN, etikett: einstellung.id },
      jetzt,
    );
    return { kalender: leseTageDerPartien(ersatz), spielplan };
  }
  const kalender = leseKalender(
    await holeJson(
      espnAdresse("scoreboard", einstellung.espn),
      { sekunden: TAG_SEKUNDEN, etikett: einstellung.id },
      jetzt,
    ),
  );
  return {
    kalender,
    spielplan: await ladeSpielplan(einstellung, kalender, jetzt),
  };
}

// Der Spielplan kommt vor der Wahl: Steigt die Nummer, trennt er Spieltage ohne Lücke.
async function ladeSpieltag(einstellung: FussballEinstellung, jetzt: Date) {
  const { kalender, spielplan } = await ladeKalender(einstellung, jetzt);
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
  const [{ spielplan, tage, partien }, normaleTabelle] = await Promise.all([
    ladeSpieltag(einstellung, jetzt),
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
    linien: einstellung.linien,
  };
}
