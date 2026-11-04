import { describe, expect, test } from "vitest";
import { neuerStand } from "@/lib/kacheln/stand";
import type { DashboardAntwort, KachelAnzeige } from "@/lib/kacheln/typen";

const ALT = "2026-11-08T13:31:00.000Z";
const NEU = "2026-11-08T13:32:00.000Z";

function anzeige(id: string, uhrzeit = "14:31:00"): KachelAnzeige {
  return {
    id,
    titel: id,
    zusatz: "Server",
    daten: { art: "test", uhrzeit },
    stand: ALT,
    fehler: false,
  };
}

function ok(id: string): DashboardAntwort["kacheln"][number] {
  return {
    id,
    titel: id,
    status: "ok",
    zusatz: "Server",
    daten: { art: "test", uhrzeit: "14:32:00" },
    stand: NEU,
  };
}

function fehler(id: string): DashboardAntwort["kacheln"][number] {
  return { id, titel: id, status: "fehler" };
}

describe("neuerStand", () => {
  test("eine erfolgreiche Kachel bekommt neue Daten", () => {
    const [kachel] = neuerStand([anzeige("a")], {
      zeit: NEU,
      kacheln: [ok("a")],
    });
    expect(kachel.daten).toEqual({ art: "test", uhrzeit: "14:32:00" });
    expect(kachel.stand).toBe(NEU);
    expect(kachel.fehler).toBe(false);
  });

  test("eine fehlerhafte Kachel behält den letzten Stand, die andere wird frisch", () => {
    const [a, b] = neuerStand([anzeige("a"), anzeige("b")], {
      zeit: NEU,
      kacheln: [fehler("a"), ok("b")],
    });
    expect(a).toEqual({ ...anzeige("a"), fehler: true });
    expect(b.stand).toBe(NEU);
    expect(b.fehler).toBe(false);
  });

  test("ein Fehler ohne bisherigen Stand zeigt keine Daten", () => {
    const [kachel] = neuerStand([], { zeit: NEU, kacheln: [fehler("a")] });
    expect(kachel).toEqual({
      id: "a",
      titel: "a",
      daten: null,
      stand: null,
      fehler: true,
    });
  });

  test("ein gescheiterter Abruf markiert alle Kacheln und behält die Daten", () => {
    const stand = neuerStand([anzeige("a"), anzeige("b")], null);
    expect(stand).toEqual([
      { ...anzeige("a"), fehler: true },
      { ...anzeige("b"), fehler: true },
    ]);
  });

  test("nach der Erholung verschwindet der Fehler", () => {
    const [kachel] = neuerStand([{ ...anzeige("a"), fehler: true }], {
      zeit: NEU,
      kacheln: [ok("a")],
    });
    expect(kachel.fehler).toBe(false);
    expect(kachel.stand).toBe(NEU);
  });

  test("Kacheln und Reihenfolge folgen der Antwort", () => {
    const stand = neuerStand([anzeige("a"), anzeige("b"), anzeige("c")], {
      zeit: NEU,
      kacheln: [ok("c"), ok("a")],
    });
    expect(stand.map((kachel) => kachel.id)).toEqual(["c", "a"]);
  });
});
