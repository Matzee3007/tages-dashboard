import type { Zone } from "@/lib/einstellungen";
import type { Partie, TeamStand } from "@/lib/kacheln/fussball/typen";

// Eine Zeile der Tabelle: Seed in der Conference (1–16), Bilanz aus Siegen, Niederlagen und Unentschieden.
export type NflZeile = {
  seed: number;
  id: string;
  name: string;
  logo: string | null;
  siege: number;
  niederlagen: number;
  unentschieden: number;
};

// Die NFL nutzt Partie und PartieZeile des Fußballs: minute trägt Viertel und Uhr („Q3 8:42“), tore die Scoring-Plays.
// division: die Division von Mein Team, conference: Ausschnitt wie beim Fußball (null in der Liste: Lücke).
// null statt der Tabellen: nicht erreichbar.
export type NflDaten = {
  art: "nfl";
  titel: string;
  tage: string[];
  partien: Partie[];
  spielfrei: TeamStand[];
  division: NflZeile[] | null;
  conference: (NflZeile | null)[] | null;
  meinTeam: string[];
  zonen: Zone[];
};
