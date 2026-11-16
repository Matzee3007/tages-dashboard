import type { FussballEinstellung } from "@/lib/einstellungen";
import { holeJson } from "@/lib/kacheln/fussball/abruf";
import { leseKalender, leseTag } from "@/lib/kacheln/fussball/espn";
import { ladeSpielplan, ladeTabelle } from "@/lib/kacheln/fussball/quellen";
import {
  sortierePartien,
  spieltagTitel,
  tabellenAusschnitt,
  waehleSpieltag,
} from "@/lib/kacheln/fussball/spieltag";
import type { FussballDaten, Partie } from "@/lib/kacheln/fussball/typen";

const ESPN = "https://site.api.espn.com/apis";
const kalenderUrl = (liga: string) =>
  `${ESPN}/site/v2/sports/soccer/${liga}/scoreboard`;

// Speicher in Sekunden (Projektvision, Entscheidungen vom 2026-11-08).
const TAG_SEKUNDEN = 86_400;
const NORMAL_SEKUNDEN = 900;

function laeuftEine(partien: Partie[]): boolean {
  return partien.some((partie) => partie.status === "laeuft");
}

async function ladeTag(
  einstellung: FussballEinstellung,
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

export async function ladeFussball(
  einstellung: FussballEinstellung,
  jetzt: Date,
): Promise<FussballDaten> {
  const etikett = einstellung.id;
  const kalender = leseKalender(
    await holeJson(
      kalenderUrl(einstellung.espn),
      { sekunden: TAG_SEKUNDEN, etikett },
      jetzt,
    ),
  );
  const tage = waehleSpieltag(kalender, jetzt);
  const [partienJeTag, normaleTabelle, spielplan] = await Promise.all([
    Promise.all(tage.map((tag) => ladeTag(einstellung, tag, jetzt))),
    ladeTabelle(einstellung, false, jetzt),
    ladeSpielplan(einstellung, tage, jetzt),
  ]);
  const partien = partienJeTag.flat();
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
