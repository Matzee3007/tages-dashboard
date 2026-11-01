import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { abmelden, anmelden } from "@/app/login/actions";
import { erstelleClient } from "@/lib/supabase/server";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ erstelleClient: vi.fn() }));

const signInWithPassword = vi.fn();
const signOut = vi.fn();

function formular(email: string, passwort: string) {
  const daten = new FormData();
  daten.set("email", email);
  daten.set("passwort", passwort);
  return daten;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(erstelleClient).mockResolvedValue({
    auth: { signInWithPassword, signOut },
  } as unknown as Awaited<ReturnType<typeof erstelleClient>>);
});

describe("anmelden", () => {
  test("richtige Daten führen zur Startseite", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    await anmelden({ fehler: null }, formular("ich@example.com", "geheim"));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "ich@example.com",
      password: "geheim",
    });
    expect(redirect).toHaveBeenCalledWith("/");
  });

  test("falsches Passwort meldet einen Fehler", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials" },
    });
    const status = await anmelden(
      { fehler: null },
      formular("ich@example.com", "falsch"),
    );
    expect(status).toEqual({ fehler: "E-Mail oder Passwort stimmt nicht." });
    expect(redirect).not.toHaveBeenCalled();
  });

  test("nicht erreichbares Supabase ist kein falsches Passwort", async () => {
    signInWithPassword.mockResolvedValue({
      error: { code: undefined, name: "AuthRetryableFetchError" },
    });
    const status = await anmelden(
      { fehler: null },
      formular("ich@example.com", "geheim"),
    );
    expect(status).toEqual({ fehler: "Anmeldung gerade nicht möglich." });
    expect(redirect).not.toHaveBeenCalled();
  });

  test("leere Felder fragen Supabase gar nicht erst", async () => {
    const status = await anmelden({ fehler: null }, formular("", ""));
    expect(status).toEqual({ fehler: "Bitte E-Mail und Passwort eingeben." });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});

test("abmelden beendet die Sitzung und führt zum Login", async () => {
  signOut.mockResolvedValue({ error: null });
  await abmelden();
  expect(signOut).toHaveBeenCalled();
  expect(redirect).toHaveBeenCalledWith("/login");
});
