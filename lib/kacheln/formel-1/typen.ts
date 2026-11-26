// Formel 1 von Jolpica (Plan Formel 1). Live-Daten gibt es nicht, „läuft“ folgt aus Startzeit und Dauer einer Session.

export type SessionArt =
  | "training1"
  | "training2"
  | "training3"
  | "sprintQualifying"
  | "sprint"
  | "qualifying"
  | "rennen";

export type Session = {
  art: SessionArt;
  name: string;
  start: string;
  status: "vorher" | "laeuft" | "vorbei";
  // Jolpica nennt nur den Tag, noch keine Uhrzeit.
  ohneZeit?: true;
};

export type Rennen = {
  saison: number;
  runde: number;
  name: string;
  ort: string;
  sessions: Session[];
};

// zeit: Bestzeit im Qualifying, Gesamtzeit des Siegers oder Abstand („+0,639“, „+1 Rd.“, „Ausfall“).
export type ErgebnisZeile = {
  platz: number;
  kuerzel: string;
  name: string;
  team: string;
  zeit: string;
};

// team nur bei Fahrern.
export type WertungsZeile = {
  platz: number;
  name: string;
  team?: string;
  punkte: number;
};

// letzteRunde: Zahl der Rennen der Saison. saisonstart: erstes Rennen der nächsten Saison, nur in der Winterpause und wenn bekannt.
export type Formel1Daten = {
  art: "formel-1";
  rennen: Rennen;
  letzteRunde: number;
  winterpause: boolean;
  ergebnis: { art: "qualifying" | "rennen"; zeilen: ErgebnisZeile[] } | null;
  fahrer: WertungsZeile[] | null;
  teams: WertungsZeile[] | null;
  wertungNachRunde: number | null;
  saisonstart: { name: string; tage: string[] } | null;
};
