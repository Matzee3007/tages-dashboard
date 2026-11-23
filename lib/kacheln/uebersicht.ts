import type { Aussehen } from "@/lib/einstellungen";
import { fussballKurz, type TeamKurz } from "@/lib/kacheln/fussball/kurz";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { kiNewsKurz, type NeueMeldung } from "@/lib/kacheln/ki-news/kurz";
import { reiterVon } from "@/lib/kacheln/reiter";
import type { KachelAnzeige } from "@/lib/kacheln/typen";

// Woher ein Eintrag der Übersicht stammt: Ein Tipp darauf führt zu dieser Kachel in ihrem Reiter.
export type Herkunft = {
  kachelId: string;
  reiter: string;
  aussehen: Aussehen;
  titel: string;
};

export type LiveEintrag = Herkunft & { partie: Partie };

export type MeinTeamEintrag = {
  id: string;
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
};

// Die Kurzfassungen aller Kacheln für den Reiter „Heute“ (ADR 0014). Kacheln ohne Daten fehlen einfach.
export function uebersicht(kacheln: KachelAnzeige[], jetzt: Date): Uebersicht {
  const ergebnis: Uebersicht = {
    live: [],
    meinTeam: [],
    neu: [],
    newsReiter: null,
  };
  for (const kachel of kacheln) {
    if (!kachel.daten) continue;
    const herkunft: Herkunft = {
      kachelId: kachel.id,
      reiter: reiterVon(kachel),
      aussehen: kachel.aussehen,
      titel: kachel.titel,
    };
    switch (kachel.daten.art) {
      case "fussball": {
        const kurz = fussballKurz(kachel.daten);
        ergebnis.live.push(
          ...kurz.live.map((partie) => ({ ...herkunft, partie })),
        );
        for (const team of kurz.meinTeam) {
          const bekannt = ergebnis.meinTeam.find(({ id }) => id === team.id);
          const eintrag = { ...herkunft, ...team };
          if (bekannt) bekannt.wettbewerbe.push(eintrag);
          else
            ergebnis.meinTeam.push({
              id: team.id,
              name: team.name,
              logo: team.logo,
              wettbewerbe: [eintrag],
            });
        }
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
