import type { KachelKopf } from "@/lib/kacheln/typen";

// Die Übersicht über alle Kacheln (ADR 0014). Sie steht immer vorn.
export const HEUTE = "Heute";

// Ein Reiter je Gruppe, eine Kachel ohne Gruppe bekommt einen eigenen (Glossar: Reiter).
export function reiterVon(kachel: KachelKopf): string {
  return kachel.gruppe ?? kachel.titel;
}

// Reihenfolge der ersten Kachel in den Einstellungen.
export function reiterListe(kacheln: KachelKopf[]): string[] {
  return [HEUTE, ...new Set(kacheln.map(reiterVon))];
}
