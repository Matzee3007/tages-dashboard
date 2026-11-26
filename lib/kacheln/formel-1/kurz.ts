import type { Formel1Daten } from "@/lib/kacheln/formel-1/typen";

// Die laufende Session für „Jetzt live“ in „Heute“ (ADR 0014). Ohne Live-Daten nur Name und Rennen.
export function formel1Kurz(
  daten: Formel1Daten,
): { session: string; rennen: string } | null {
  const laufend = daten.rennen.sessions.find(
    (session) => session.status === "laeuft",
  );
  return laufend ? { session: laufend.name, rennen: daten.rennen.name } : null;
}
