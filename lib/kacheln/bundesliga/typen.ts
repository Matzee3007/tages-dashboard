export type TeamStand = {
  id: string;
  name: string;
  logo: string | null;
  // null, solange die Partie nicht angepfiffen ist.
  tore: number | null;
};

// text z. B. "García 7'", teamId: das Team, für das das Tor zählt.
export type Tor = { text: string; teamId: string };

export type Partie = {
  id: string;
  anstoss: string;
  status: "vorher" | "laeuft" | "vorbei";
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
