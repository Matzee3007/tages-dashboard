import type { Aussehen } from "@/lib/einstellungen";
import { fussballKurz, type TeamKurz } from "@/lib/kacheln/fussball/kurz";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { kiNewsKurz, type NeueMeldung } from "@/lib/kacheln/ki-news/kurz";
import { nflKurz } from "@/lib/kacheln/nfl/kurz";
import { formel1Kurz } from "@/lib/kacheln/formel-1/kurz";
import { reiterVon } from "@/lib/kacheln/reiter";
import type { KachelAnzeige } from "@/lib/kacheln/typen";

// Woher ein Eintrag der Übersicht stammt: Ein Tipp darauf führt zu dieser Kachel in ihrem Reiter.
export type Herkunft = {
  kachelId: string;
  reiter: string;
  aussehen: Aussehen;
  titel: string;
};

// meinTeam: die Teams der Kachel, damit die Partie in „Jetzt live“ hervorgehoben wird wie in der Kachel.
// Eine laufende Partie oder eine laufende Session der Formel 1 (ohne Live-Daten nur Name und Rennen).
export type LiveEintrag = Herkunft &
  (
    { partie: Partie; meinTeam: string[] } | { session: string; rennen: string }
  );

// art: Kennungen von ESPN gelten nur innerhalb einer Sportart, die NFL-26 ist nicht der Fußball-Club 26.
export type MeinTeamEintrag = {
  id: string;
  art: "fussball" | "nfl";
  name: string;
  logo: string | null;
  wettbewerbe: (Herkunft & TeamKurz)[];
};

export type Uebersicht = {
  live: LiveEintrag[];
  meinTeam: MeinTeamEintrag[];
  neu: (NeueMeldung & { reiter: string })[];
  // Wohin „Alle Meldungen“ führt, auch wenn es nichts Neues gibt. null: keine KI-News mit Daten.
  newsReiter: string | null;
  // Kacheln, deren letzter Abruf scheiterte: „Heute“ zeigt einen Hinweis statt still zu fehlen.
  fehler: Herkunft[];
};

// Die Kurzfassungen aller Kacheln für den Reiter „Heute“ (ADR 0014). Kacheln ohne Daten fehlen einfach.
export function uebersicht(kacheln: KachelAnzeige[], jetzt: Date): Uebersicht {
  const ergebnis: Uebersicht = {
    live: [],
    meinTeam: [],
    neu: [],
    newsReiter: null,
    fehler: [],
  };
  for (const kachel of kacheln) {
    const herkunft: Herkunft = {
      kachelId: kachel.id,
      reiter: reiterVon(kachel),
      aussehen: kachel.aussehen,
      titel: kachel.titel,
    };
    if (kachel.fehler) ergebnis.fehler.push(herkunft);
    if (!kachel.daten) continue;
    switch (kachel.daten.art) {
      // Fußball und NFL liefern dieselbe Form der Kurzfassung.
      case "fussball":
      case "nfl": {
        const kurz =
          kachel.daten.art === "nfl"
            ? nflKurz(kachel.daten)
            : fussballKurz(kachel.daten);
        const { meinTeam } = kachel.daten;
        ergebnis.live.push(
          ...kurz.live.map((partie) => ({
            ...herkunft,
            partie,
            meinTeam,
          })),
        );
        for (const team of kurz.meinTeam) {
          const art = kachel.daten.art;
          const bekannt = ergebnis.meinTeam.find(
            (eintrag) => eintrag.id === team.id && eintrag.art === art,
          );
          const eintrag = { ...herkunft, ...team };
          if (bekannt) {
            bekannt.wettbewerbe.push(eintrag);
            // Kannte der erste Wettbewerb nur die Kennung, gilt der Name eines späteren.
            if (bekannt.name === bekannt.id) bekannt.name = team.name;
            bekannt.logo ??= team.logo;
          } else
            ergebnis.meinTeam.push({
              id: team.id,
              art,
              name: team.name,
              logo: team.logo,
              wettbewerbe: [eintrag],
            });
        }
        break;
      }
      case "formel-1": {
        const laufend = formel1Kurz(kachel.daten);
        if (laufend) ergebnis.live.push({ ...herkunft, ...laufend });
        break;
      }
      case "ki-news":
        ergebnis.newsReiter = herkunft.reiter;
        ergebnis.neu.push(
          ...kiNewsKurz(kachel.daten, jetzt).map((neu) => ({
            ...neu,
            reiter: herkunft.reiter,
          })),
        );
        break;
    }
  }
  return ergebnis;
}

// Punkt am Reiter mit laufender Partie, Zahl der neuen Meldungen am Reiter der KI-News.
export function abzeichen(stand: Uebersicht): Record<string, "live" | number> {
  const zeichen: Record<string, "live" | number> = {};
  for (const { reiter } of stand.live) zeichen[reiter] = "live";
  for (const { reiter } of stand.neu) {
    const bisher = zeichen[reiter];
    zeichen[reiter] = (typeof bisher === "number" ? bisher : 0) + 1;
  }
  return zeichen;
}
