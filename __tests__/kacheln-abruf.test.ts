import { afterEach, expect, test, vi } from "vitest";
import { holeDashboard } from "@/lib/kacheln/abruf";

const DATEN = { zeit: "2026-11-08T13:32:00.000Z", kacheln: [] };

function fetchAttrappe(antwort: Partial<Response> | Error) {
  const attrappe = vi.fn(async () => {
    if (antwort instanceof Error) throw antwort;
    return antwort as Response;
  });
  vi.stubGlobal("fetch", attrappe);
  return attrappe;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test("eine gute Antwort liefert die Daten und umgeht jeden Zwischenspeicher", async () => {
  const attrappe = fetchAttrappe({
    ok: true,
    status: 200,
    json: async () => DATEN,
  });

  await expect(holeDashboard()).resolves.toEqual(DATEN);
  expect(attrappe).toHaveBeenCalledWith(
    "/api/kacheln",
    expect.objectContaining({ cache: "no-store" }),
  );
});

test("Status 401 heißt abgemeldet", async () => {
  fetchAttrappe({ ok: false, status: 401 });
  await expect(holeDashboard()).resolves.toBe("abgemeldet");
});

test.each([500, 503])(
  "Status %i ist ein vorübergehender Fehler, nicht abgemeldet",
  async (status) => {
    fetchAttrappe({ ok: false, status });
    await expect(holeDashboard()).resolves.toBeNull();
  },
);

test.each([[{}], [{ kacheln: "kaputt" }], [null]])(
  "eine Antwort in falscher Form (%j) liefert null",
  async (daten) => {
    fetchAttrappe({ ok: true, status: 200, json: async () => daten });
    await expect(holeDashboard()).resolves.toBeNull();
  },
);

test("eine Antwort ohne JSON liefert null", async () => {
  fetchAttrappe({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError("kein JSON");
    },
  });
  await expect(holeDashboard()).resolves.toBeNull();
});

test("ein Netzausfall wirft nicht, sondern liefert null", async () => {
  fetchAttrappe(new TypeError("Failed to fetch"));
  await expect(holeDashboard()).resolves.toBeNull();
});

test("frisch schickt ein POST mit der Kachel", async () => {
  const attrappe = fetchAttrappe({
    ok: true,
    status: 200,
    json: async () => DATEN,
  });

  await expect(holeDashboard("ki-news")).resolves.toEqual(DATEN);
  expect(attrappe).toHaveBeenCalledWith(
    "/api/kacheln?frisch=ki-news",
    expect.objectContaining({ method: "POST", cache: "no-store" }),
  );
});
