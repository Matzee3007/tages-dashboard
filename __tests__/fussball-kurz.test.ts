import { expect, test } from "vitest";
import { fussballKurz } from "@/lib/kacheln/fussball/kurz";
import type {
  FussballDaten,
  Partie,
  TabellenZeile,
} from "@/lib/kacheln/fussball/typen";

const team = (id: string, name: string, tore: number | null = null) => ({
  id,
  name,
  logo: `https://logo/${id}.png`,
  tore,
});

const partie = (
  id: string,
  status: Partie["status"],
  anstoss: string,
  heim: string,
  gast: string,
): Partie => ({
  id,
  anstoss,
  status,
  minute: status === "laeuft" ? "35'" : null,
  heim: team(heim, `Team ${heim}`),
  gast: team(gast, `Team ${gast}`),
  tore: [],
});

const zeile = (platz: number, id: string, punkte: number): TabellenZeile => ({
  platz,
  id,
  name: `Tabelle ${id}`,
  logo: null,
  spiele: 11,
  differenz: 10,
  punkte,
});

const daten = (
  partien: Partie[],
  meinTeam: string[],
  tabelle: FussballDaten["tabelle"] = [zeile(1, "132", 30), zeile(2, "7", 25)],
): FussballDaten => ({
  art: "fussball",
  titel: "12. Spieltag",
  tage: ["2026-11-22"],
  partien,
  tabelle,
  meinTeam,
  zonen: [
    { von: 1, bis: 4, name: "Champions League", farbe: "#4C8DF6" },
    { von: 17, bis: 18, name: "Abstieg", farbe: "#E5484D" },
  ],
});

test("live sind alle laufenden Partien in der Reihenfolge der Daten", () => {
  const kurz = fussballKurz(
    daten(
      [
        partie("a", "vorbei", "2026-11-22T12:30:00Z", "1", "2"),
        partie("b", "laeuft", "2026-11-22T14:30:00Z", "3", "4"),
        partie("c", "laeuft", "2026-11-22T14:30:00Z", "5", "6"),
      ],
      [],
    ),
  );
  expect(kurz.live.map((p) => p.id)).toEqual(["b", "c"]);
});

test("Mein Team: laufende Partie vor der nächsten, Platz mit Zone aus der Tabelle", () => {
  const kurz = fussballKurz(
    daten(
      [
        partie("naechste", "vorher", "2026-11-25T20:00:00Z", "132", "9"),
        partie("live", "laeuft", "2026-11-22T14:30:00Z", "8", "132"),
      ],
      ["132"],
    ),
  );
  expect(kurz.meinTeam).toEqual([
    {
      id: "132",
      name: "Team 132",
      logo: "https://logo/132.png",
      partie: expect.objectContaining({ id: "live" }),
      platz: {
        platz: 1,
        punkte: 30,
        zone: { von: 1, bis: 4, name: "Champions League", farbe: "#4C8DF6" },
      },
    },
  ]);
});

test("Mein Team: ohne laufende die früheste nächste, sonst die letzte, abgesagte nie", () => {
  const vorher = fussballKurz(
    daten(
      [
        partie("spaet", "vorher", "2026-11-29T15:30:00Z", "132", "9"),
        partie("frueh", "vorher", "2026-11-28T19:30:00Z", "9", "132"),
        partie("alt", "vorbei", "2026-11-21T14:30:00Z", "132", "8"),
      ],
      ["132"],
    ),
  );
  expect(vorher.meinTeam[0].partie?.id).toBe("frueh");

  const vorbei = fussballKurz(
    daten(
      [
        partie("erste", "vorbei", "2026-11-21T14:30:00Z", "132", "8"),
        partie("zweite", "vorbei", "2026-11-22T14:30:00Z", "9", "132"),
        partie("weg", "abgesagt", "2026-11-23T14:30:00Z", "132", "5"),
      ],
      ["132"],
    ),
  );
  expect(vorbei.meinTeam[0].partie?.id).toBe("zweite");

  const keine = fussballKurz(
    daten(
      [partie("weg", "abgesagt", "2026-11-23T14:30:00Z", "132", "5")],
      ["132"],
    ),
  );
  expect(keine.meinTeam[0].partie).toBeNull();
});

test("Mein Team ohne Partie und ohne Tabelle: Name aus der Tabelle oder die id, Platz null", () => {
  const ausTabelle = fussballKurz(daten([], ["7"]));
  expect(ausTabelle.meinTeam[0]).toMatchObject({
    name: "Tabelle 7",
    logo: null,
    platz: {
      platz: 2,
      punkte: 25,
      zone: expect.objectContaining({ name: "Champions League" }),
    },
  });

  const ohneTabelle = fussballKurz(daten([], ["7"], null));
  expect(ohneTabelle.meinTeam[0]).toEqual({
    id: "7",
    name: "7",
    logo: null,
    partie: null,
    platz: null,
  });
});

test("ein Platz außerhalb jeder Zone hat zone null, Lücken in der Tabelle stören nicht", () => {
  const kurz = fussballKurz(
    daten([], ["11"], [zeile(1, "132", 30), null, zeile(10, "11", 15)]),
  );
  expect(kurz.meinTeam[0].platz).toEqual({ platz: 10, punkte: 15, zone: null });
});
