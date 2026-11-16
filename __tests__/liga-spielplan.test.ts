// @vitest-environment node
import { expect, test } from "vitest";
import { leseSpielplan } from "@/lib/kacheln/liga/spielplan";

// Wie getmatchdata/bl1/2026 von OpenLigaDB: matchDateTime in deutscher Zeit, ohne Zone.
function partie(matchDateTime: string, groupOrderID: number) {
  return { matchDateTime, group: { groupOrderID } };
}

test("ordnet jedem Tag die höchste Nummer seiner Partien zu", () => {
  const json = [
    partie("2026-11-07T15:30:00", 9),
    partie("2026-11-08T15:30:00", 9),
    partie("2026-11-08T19:30:00", 9),
    partie("2026-11-08T18:00:00", 5),
  ];
  expect(leseSpielplan(json)).toEqual(
    new Map([
      ["2026-11-07", 9],
      ["2026-11-08", 9],
    ]),
  );
});

test("wirft bei falscher Form", () => {
  expect(() => leseSpielplan({})).toThrow("Unerwartete Antwort von OpenLigaDB");
});
