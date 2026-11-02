// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { config, proxy } from "@/proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/besitzer", () => ({ BESITZER_ID: "meine-id" }));

type Erneuerung = {
  cookies: { name: string; value: string; options: object }[];
  headers: Record<string, string>;
};

// Attrappe von Supabase: meldet die Sitzung eines Kontos oder keine und kann beim Prüfen Cookies erneuern.
function attrappe(konto: boolean | string, erneuerung?: Erneuerung) {
  const sub = konto === true ? "meine-id" : konto;
  vi.mocked(createServerClient).mockImplementation(((
    _url: string,
    _key: string,
    optionen: {
      cookies: {
        setAll: (
          cookies: Erneuerung["cookies"],
          headers: Erneuerung["headers"],
        ) => void;
      };
    },
  ) => ({
    auth: {
      getClaims: async () => {
        if (erneuerung) {
          optionen.cookies.setAll(erneuerung.cookies, erneuerung.headers);
        }
        return {
          data: sub ? { claims: { sub } } : null,
          error: null,
        };
      },
    },
  })) as unknown as typeof createServerClient);
}

function anfrage(pfad: string) {
  return new NextRequest(new URL(pfad, "https://heute.example"));
}

function zielPfad(antwort: Response) {
  return new URL(antwort.headers.get("location")!).pathname;
}

beforeEach(() => {
  vi.mocked(createServerClient).mockReset();
});

describe("ohne Sitzung", () => {
  test.each(["/", "/kacheln", "/api/x"])("%s führt zum Login", async (pfad) => {
    attrappe(false);
    const antwort = await proxy(anfrage(pfad));
    expect(antwort.status).toBe(307);
    expect(zielPfad(antwort)).toBe("/login");
  });

  test.each(["/login-alt", "/login/x"])(
    "ähnlich benannter Pfad %s ist nicht öffentlich",
    async (pfad) => {
      attrappe(false);
      const antwort = await proxy(anfrage(pfad));
      expect(antwort.status).toBe(307);
      expect(zielPfad(antwort)).toBe("/login");
    },
  );

  test("der Login ist erreichbar", async () => {
    attrappe(false);
    const antwort = await proxy(anfrage("/login"));
    expect(antwort.headers.get("location")).toBeNull();
    expect(antwort.status).toBe(200);
  });
});

describe("mit Sitzung", () => {
  test("die Startseite ist erreichbar", async () => {
    attrappe(true);
    const antwort = await proxy(anfrage("/"));
    expect(antwort.headers.get("location")).toBeNull();
    expect(antwort.status).toBe(200);
  });

  test("der Login führt zur Startseite", async () => {
    attrappe(true);
    const antwort = await proxy(anfrage("/login"));
    expect(antwort.status).toBe(307);
    expect(zielPfad(antwort)).toBe("/");
  });
});

describe("mit fremdem Konto", () => {
  test("die Startseite führt zum Login", async () => {
    attrappe("fremde-id");
    const antwort = await proxy(anfrage("/"));
    expect(antwort.status).toBe(307);
    expect(zielPfad(antwort)).toBe("/login");
  });

  test("der Login ist erreichbar, ohne Schleife", async () => {
    attrappe("fremde-id");
    const antwort = await proxy(anfrage("/login"));
    expect(antwort.headers.get("location")).toBeNull();
    expect(antwort.status).toBe(200);
  });
});

describe("erneuerte Cookies und Cache-Header bleiben erhalten", () => {
  const erneuerung: Erneuerung = {
    cookies: [{ name: "sb-token", value: "neu", options: { path: "/" } }],
    headers: { "Cache-Control": "no-store" },
  };

  test("ohne Weiterleitung", async () => {
    attrappe(true, erneuerung);
    const antwort = await proxy(anfrage("/"));
    expect(antwort.headers.get("location")).toBeNull();
    expect(antwort.cookies.get("sb-token")?.value).toBe("neu");
    expect(antwort.headers.get("cache-control")).toBe("no-store");
  });

  test("bei Weiterleitung", async () => {
    attrappe(false, erneuerung);
    const antwort = await proxy(anfrage("/"));
    expect(antwort.status).toBe(307);
    expect(antwort.cookies.get("sb-token")?.value).toBe("neu");
    expect(antwort.headers.get("cache-control")).toBe("no-store");
  });
});

test("ohne Variablen bleibt die Seite zu", async () => {
  vi.mocked(createServerClient).mockImplementation(() => {
    throw new Error("Your project's URL and Key are required");
  });
  await expect(proxy(anfrage("/"))).rejects.toThrow();
});

describe("matcher", () => {
  const muster = new RegExp(`^${config.matcher[0]}$`);

  test.each([
    "/",
    "/login",
    "/api/x",
    "/kacheln",
    "/favicon.icon",
    "/favicon.ico-alt",
    "/favicon.ico/x",
    "/_next/static-alt",
    "/_next/image-x",
    "/_next/imagex/y",
    "/manifest.webmanifest/x",
    "/manifest.webmanifest-alt",
    "/icons",
    "/icons-alt",
    "/icons-alt/a.png",
    "/icons/",
    "/icons/seite",
    "/icons/a.svg",
    "/icons/unter/a.png",
    "/icons/a.png/x",
  ])("prüft %s", (pfad) => {
    expect(muster.test(pfad)).toBe(true);
  });

  test.each([
    "/_next/static/a.js",
    "/_next/image",
    "/favicon.ico",
    "/manifest.webmanifest",
    "/icons/icon-180.png",
    "/icons/icon-512.png",
    "/icons/favicon-32.png",
  ])("lässt %s aus", (pfad) => {
    expect(muster.test(pfad)).toBe(false);
  });
});
