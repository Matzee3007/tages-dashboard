import type { Aussehen } from "@/lib/einstellungen";
import type { FussballDaten } from "@/lib/kacheln/fussball/typen";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";

export type KiNewsDaten = { art: "ki-news"; absender: AbsenderStand[] };

export type KachelDaten = KiNewsDaten | FussballDaten;

// Was jede Kachel immer trägt, auch im Fehlerfall.
export type KachelKopf = {
  id: string;
  titel: string;
  aussehen: Aussehen;
  gruppe?: string;
};

export function kopfVon({
  id,
  titel,
  aussehen,
  gruppe,
}: KachelKopf): KachelKopf {
  return { id, titel, aussehen, ...(gruppe && { gruppe }) };
}

// Eine Kachel in der Antwort des Servers. Der Fehler trägt bewusst keinen Text, der bleibt im Server-Log.
export type KachelAntwort = KachelKopf &
  (
    | { status: "ok"; zusatz?: string; daten: KachelDaten; stand: string }
    | { status: "fehler" }
  );

export type DashboardAntwort = { zeit: string; kacheln: KachelAntwort[] };

// Eine Kachel im Browser: Bei einem Fehler bleiben die letzten Daten stehen.
export type KachelAnzeige = KachelKopf & {
  zusatz?: string;
  daten: KachelDaten | null;
  stand: string | null;
  fehler: boolean;
};
