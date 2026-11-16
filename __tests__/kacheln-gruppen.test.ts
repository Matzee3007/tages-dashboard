import { expect, test } from "vitest";
import { gruppiere } from "@/lib/kacheln/gruppen";
import type { KachelAnzeige } from "@/lib/kacheln/typen";

function kachel(id: string, gruppe?: string): KachelAnzeige {
  return {
    id,
    titel: id,
    aussehen: { farbe: "#8E99A8" },
    ...(gruppe && { gruppe }),
    daten: null,
    stand: null,
    fehler: false,
  };
}

const ids = (bloecke: ReturnType<typeof gruppiere>) =>
  bloecke.map(({ gruppe, kacheln }) => [gruppe, kacheln.map((k) => k.id)]);

test("aufeinanderfolgende Kacheln einer Gruppe bilden einen Block", () => {
  const bloecke = gruppiere([
    kachel("bl", "Sport"),
    kachel("pl", "Sport"),
    kachel("cl", "Sport"),
    kachel("ki"),
  ]);
  expect(ids(bloecke)).toEqual([
    ["Sport", ["bl", "pl", "cl"]],
    [null, ["ki"]],
  ]);
});

test("jede Kachel ohne Gruppe steht für sich, die Reihenfolge bleibt", () => {
  const bloecke = gruppiere([kachel("a"), kachel("b"), kachel("c", "Sport")]);
  expect(ids(bloecke)).toEqual([
    [null, ["a"]],
    [null, ["b"]],
    ["Sport", ["c"]],
  ]);
});
