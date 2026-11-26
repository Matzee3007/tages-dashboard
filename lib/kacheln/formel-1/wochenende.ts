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
  // Mit roter Flagge dauert ein Rennen bis zu drei Stunden (Review von PR #100).
  rennen: 180,
};

// So viele Tage vor der ersten Session einer Saison endet die Winterpause.
const VORLAUF_TAGE = 7;

// Ein Rennen bleibt bis Mitternacht (deutsche Zeit) des Tages nach dem Rennen aktuell (Regel aller Wettbewerbe).
function giltNoch(rennen: Rennen, jetzt: Date): boolean {
  const renntag = heute(new Date(rennen.sessions.at(-1)!.start));
  return heute(jetzt) <= folgetag(renntag);
}

function mitStatus(session: Session, jetzt: Date): Session {
  if (session.ohneZeit) {
    const vorbei = heute(jetzt) > heute(new Date(session.start));
    return { ...session, status: vorbei ? "vorbei" : "vorher" };
  }
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

// Alle Rennen der Saison sind vorbei (Dezember), im Unterschied zu „die Saison hat noch nicht begonnen“ (Januar bis März).
export function saisonVorbei(rennen: Rennen[], jetzt: Date): boolean {
  return !rennen.some((eines) => giltNoch(eines, jetzt));
}

// Winterpause: das letzte Rennen ist vorbei, oder die Saison beginnt erst in mehr als VORLAUF_TAGE Tagen.
export function istWinterpause(rennen: Rennen[], jetzt: Date): boolean {
  if (!rennen.some((eines) => giltNoch(eines, jetzt))) return true;
  const erste = Date.parse(rennen[0].sessions[0].start);
  return jetzt.getTime() < erste - VORLAUF_TAGE * 86_400_000;
}
