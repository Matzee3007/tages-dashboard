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
    redirected: false,
    json: async () => DATEN,
  });

  await expect(holeDashboard()).resolves.toEqual(DATEN);
  expect(attrappe).toHaveBeenCalledWith(
    "/api/kacheln",
    expect.objectContaining({ cache: "no-store" }),
  );
});

test("eine Weiterleitung zum Login heißt abgemeldet", async () => {
  fetchAttrappe({ ok: true, redirected: true });
  await expect(holeDashboard()).resolves.toBe("abgemeldet");
});

test("Status 500 liefert null", async () => {
  fetchAttrappe({ ok: false, redirected: false });
  await expect(holeDashboard()).resolves.toBeNull();
});

test("eine Antwort ohne JSON liefert null", async () => {
  fetchAttrappe({
    ok: true,
    redirected: false,
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
