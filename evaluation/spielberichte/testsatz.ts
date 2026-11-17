// Testsatz der Evaluation der Spielberichte (Plan 2026-11-17-spielberichte, Aufgabe 4, ADR 0013): echte, beendete Partien,
// am 2026-11-17 bei ESPN gefunden. tag: Tag der Partie bei ESPN (scoreboard?dates=).

import type { FussballEinstellung } from "@/lib/einstellungen";

export type TestPartie = {
  liga: FussballEinstellung["espn"];
  tag: string;
  partie: string;
  art: string;
};

export const TESTSATZ_SPIELBERICHTE: TestPartie[] = [
  { liga: "ger.1", tag: "20261108", partie: "401884738", art: "normal" },
  { liga: "ger.1", tag: "20261024", partie: "401884756", art: "0:0" },
  {
    liga: "ger.1",
    tag: "20261107",
    partie: "401884737",
    art: "Elfmeter, Platzverweis",
  },
  {
    liga: "ger.1",
    tag: "20261025",
    partie: "401884759",
    art: "Eigentor, Mein Team",
  },
  { liga: "ger.1", tag: "20261107", partie: "401884744", art: "viele Tore" },
  {
    liga: "eng.1",
    tag: "20261108",
    partie: "401879240",
    art: "Elfmeter, viele Tore",
  },
  {
    liga: "eng.1",
    tag: "20261024",
    partie: "401878767",
    art: "Eigentor, Platzverweis",
  },
  {
    liga: "eng.1",
    tag: "20261108",
    partie: "401878759",
    art: "Elfmeter, Eigentor",
  },
  {
    liga: "uefa.champions",
    tag: "20261104",
    partie: "401915381",
    art: "Champions League, Mein Team",
  },
  {
    liga: "uefa.champions",
    tag: "20261104",
    partie: "401915305",
    art: "Champions League, sehr viele Tore",
  },
];
