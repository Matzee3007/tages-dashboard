import type { Rennen, Session, SessionArt } from "@/lib/kacheln/formel-1/typen";
import { folgetag, heute } from "@/lib/zeit";

// Dauer einer Session in Minuten (Plan Formel 1). Danach gilt sie als vorbei, auch wenn das Ergebnis noch fehlt.
const DAUER_MIN: Record<SessionArt, number> = {
  training1: 60,
  training2: 60,
  training3: 60,
  sprintQualifying: 45,
  sprint: 45,
  qualifying: 60,
  rennen: 120,
};

// Ein Rennen bleibt bis Mitternacht (deutsche Zeit) des Tages nach dem Rennen aktuell (Regel aller Wettbewerbe).
function giltNoch(rennen: Rennen, jetzt: Date): boolean {
  const renntag = heute(new Date(rennen.sessions.at(-1)!.start));
  return heute(jetzt) <= folgetag(renntag);
}

function mitStatus(session: Session, jetzt: Date): Session {
  const beginn = Date.parse(session.start);
  const ende = beginn + DAUER_MIN[session.art] * 60_000;
  const zeit = jetzt.getTime();
  const status = zeit < beginn ? "vorher" : zeit < ende ? "laeuft" : "vorbei";
  return { ...session, status };
}

// Das aktuelle Rennwochenende mit dem Status jeder Session. Nach dem letzten Rennen bleibt das letzte (Winterpause).
export function waehleRennen(rennen: Rennen[], jetzt: Date): Rennen {
  const aktuell =
    rennen.find((eines) => giltNoch(eines, jetzt)) ?? rennen.at(-1)!;
  return {
    ...aktuell,
    sessions: aktuell.sessions.map((session) => mitStatus(session, jetzt)),
  };
}

export function istWinterpause(rennen: Rennen[], jetzt: Date): boolean {
  return !rennen.some((eines) => giltNoch(eines, jetzt));
}
