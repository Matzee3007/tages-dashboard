export type KachelEinstellung = {
  id: string;
  art: "test";
  titel: string;
  fehlerAusloesen: boolean;
};

// Die Reihenfolge hier ist die Reihenfolge auf dem Bildschirm.
export const KACHELN: KachelEinstellung[] = [
  { id: "test", art: "test", titel: "Testkachel", fehlerAusloesen: false },
];
