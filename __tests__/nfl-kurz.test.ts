import { expect, test } from "vitest";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { nflKurz } from "@/lib/kacheln/nfl/kurz";
import type { NflDaten, NflZeile } from "@/lib/kacheln/nfl/typen";

const ZONEN = [
  { von: 1, bis: 4, name: "Division-Sieger", farbe: "#4C8DF6" },
  { von: 5, bis: 7, name: "Wildcard", farbe: "#22B8CF" },
];

const team = (id: string, name: string) => ({
  id,
  name,
  logo: `https://logo/${id}.png`,
  tore: null,
});

const partie = (
  id: string,
  status: Partie["status"],
  anstoss: string,
  heim: [string, string],
  gast: [string, string],
): Partie => ({
  id,
  anstoss,
  status,
  minute: status === "laeuft" ? "Q3 8:42" : null,
  heim: team(...heim),
  gast: team(...gast),
  tore: [],
});

const zeile = (
  seed: number,
  id: string,
  name: string,
  siege: number,
  niederlagen: number,
  unentschieden = 0,
): NflZeile => ({
  seed,
  id,
  name,
  logo: null,
  siege,
  niederlagen,
  unentschieden,
});

const daten = (
  partien: Partie[],
  spielfrei: NflDaten["spielfrei"] = [],
): NflDaten => ({
  art: "nfl",
  titel: "Woche 12",
  tage: [],
  partien,
  spielfrei,
  divisionName: "NFC West",
  division: [
    zeile(1, "25", "49ers", 9, 1),
    zeile(8, "26", "Seahawks", 6, 4),
    zeile(9, "14", "Rams", 6, 4, 1),
  ],
  conference: null,
  meinTeam: ["26"],
  zonen: ZONEN,
});

test("live sind die laufenden Partien, Mein Team mit laufender Partie und Chip aus Bilanz und Seed", () => {
  const kurz = nflKurz(
    daten([
      partie(
        "live",
        "laeuft",
        "2026-11-29T21:05Z",
        ["26", "Seahawks"],
        ["14", "Rams"],
      ),
      partie(
        "vorbei",
        "vorbei",
        "2026-11-29T18:00Z",
        ["8", "Lions"],
        ["9", "Packers"],
      ),
    ]),
  );
  expect(kurz.live.map((p) => p.id)).toEqual(["live"]);
  expect(kurz.meinTeam).toEqual([
    {
      id: "26",
      name: "Seahawks",
      logo: "https://logo/26.png",
      partie: expect.objectContaining({ id: "live" }),
      platz: { text: "6–4 · Seed 8", zone: null },
    },
  ]);
});

test("Unentschieden stehen in der Bilanz, die Zone kommt aus dem Seed", () => {
  const ohneMein = { ...daten([]), meinTeam: ["14", "25"] };
  const [rams, niners] = nflKurz(ohneMein).meinTeam;
  expect(rams.platz).toEqual({ text: "6–4–1 · Seed 9", zone: null });
  expect(niners.platz).toEqual({ text: "9–1 · Seed 1", zone: ZONEN[0] });
});

test("spielfrei: keine Partie, der Chip bleibt, Name aus der Tabelle", () => {
  const kurz = nflKurz(daten([], [team("26", "Seahawks")]));
  expect(kurz.meinTeam[0]).toMatchObject({
    name: "Seahawks",
    partie: null,
    platz: { text: "6–4 · Seed 8" },
  });
});

test("ohne Tabelle kein Chip", () => {
  const kurz = nflKurz({ ...daten([]), division: null });
  expect(kurz.meinTeam[0]).toMatchObject({ id: "26", name: "26", platz: null });
});

test("ohne Seed zeigt der Chip nur die Bilanz", () => {
  const ohne = daten([]);
  ohne.division = [{ ...ohne.division![1], seed: null }];
  expect(nflKurz(ohne).meinTeam[0].platz).toEqual({ text: "6–4", zone: null });
});
