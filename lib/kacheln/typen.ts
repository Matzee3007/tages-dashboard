import type { FussballDaten } from "@/lib/kacheln/fussball/typen";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";

export type KiNewsDaten = { art: "ki-news"; absender: AbsenderStand[] };

export type KachelDaten = KiNewsDaten | FussballDaten;

// Eine Kachel in der Antwort des Servers. Der Fehler trägt bewusst keinen Text, der bleibt im Server-Log.
export type KachelAntwort = { id: string; titel: string } & (
  | { status: "ok"; zusatz?: string; daten: KachelDaten; stand: string }
  | { status: "fehler" }
);

export type DashboardAntwort = { zeit: string; kacheln: KachelAntwort[] };

// Eine Kachel im Browser: Bei einem Fehler bleiben die letzten Daten stehen.
export type KachelAnzeige = {
  id: string;
  titel: string;
  zusatz?: string;
  daten: KachelDaten | null;
  stand: string | null;
  fehler: boolean;
};
