import type { Zone } from "@/lib/einstellungen";
import type { Partie, TeamStand } from "@/lib/kacheln/fussball/typen";

// Eine Zeile der Tabelle: Seed in der Conference (1–16), Bilanz aus Siegen, Niederlagen und Unentschieden.
// seed null: ESPN nennt keinen (z. B. vor der ersten Woche), das Team steht dann am Ende.
export type NflZeile = {
  seed: number | null;
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
  // Name der Division von Mein Team wie bei ESPN, z. B. „NFC West“. Die Conference heißt nach seinem ersten Wort.
  divisionName: string;
  division: NflZeile[] | null;
  conference: (NflZeile | null)[] | null;
  meinTeam: string[];
  zonen: Zone[];
};
