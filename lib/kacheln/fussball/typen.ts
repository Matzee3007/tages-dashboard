import type { Zone } from "@/lib/einstellungen";

export type TeamStand = {
  id: string;
  name: string;
  logo: string | null;
  // null, solange die Partie nicht angepfiffen ist.
  tore: number | null;
};

// text z. B. "García 7'".
// seite: das Team, dem ESPN das Tor gutschreibt, bei einem Eigentor also der Gegner des Schützen.
export type Tor = { text: string; seite: "heim" | "gast" };

export type Partie = {
  id: string;
  anstoss: string;
  // abgesagt: verlegt oder abgesagt, ohne Ergebnis.
  status: "vorher" | "laeuft" | "vorbei" | "abgesagt";
  minute: string | null;
  heim: TeamStand;
  gast: TeamStand;
  tore: Tor[];
};

export type TabellenZeile = {
  platz: number;
  id: string;
  name: string;
  logo: string | null;
  spiele: number;
  differenz: number;
  punkte: number;
};

// tabelle: Ausschnitt, null in der Liste steht für eine Lücke, null statt der Liste: Tabelle nicht erreichbar.
// titel null: keine Nummer bekannt.
export type FussballDaten = {
  art: "fussball";
  titel: string | null;
  tage: string[];
  partien: Partie[];
  tabelle: (TabellenZeile | null)[] | null;
  meinTeam: string[];
  zonen: Zone[];
};
