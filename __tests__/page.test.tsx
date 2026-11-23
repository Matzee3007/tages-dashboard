import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Page from "@/app/page";
import { holeDashboard } from "@/lib/kacheln/abruf";
import type { DashboardAntwort, KachelDaten } from "@/lib/kacheln/typen";

vi.mock("@/app/login/actions", () => ({ abmelden: vi.fn() }));
vi.mock("@/lib/kacheln/abruf", () => ({ holeDashboard: vi.fn() }));
const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const ZEIT = "2026-11-08T13:32:07.000Z";
const OK: DashboardAntwort = {
  zeit: ZEIT,
  kacheln: [
    {
      id: "ki-news",
      titel: "KI-News",
      aussehen: { farbe: "#8E99A8" },
      status: "ok",
      daten: {
        art: "ki-news",
        absender: [
          {
            name: "Anthropic",
            aussehen: { farbe: "#8E99A8" },
            meldungen: [
              {
                titel: "Introducing Claude",
                link: "https://www.anthropic.com/news/claude",
                zeit: "2026-11-08T10:00:00.000Z",
              },
            ],
            letzteMeldung: "2026-11-08T10:00:00.000Z",
            erreichbar: true,
          },
        ],
      },
      stand: ZEIT,
    },
  ],
};

beforeEach(() => {
  vi.mocked(holeDashboard).mockReset();
});

afterEach(cleanup);

// Die Kacheln stehen in ihren Reitern, beim Öffnen ist „Heute“ vorn (ADR 0014).
async function oeffne(reiter: string) {
  const bereiche = await screen.findByRole("navigation", { name: "Bereiche" });
  fireEvent.click(
    await within(bereiche).findByRole("button", { name: reiter }),
  );
}

test("zeigt Datum, Zeit der Aktualisierung, Kachel und Abmelden", async () => {
  vi.mocked(holeDashboard).mockResolvedValue(OK);
  render(<Page />);

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Sonntag, 8. November",
    }),
  ).toBeDefined();
  expect(screen.getByText("Sonntag")).toBeDefined();
  expect(screen.getByText("Aktualisiert 14:32")).toBeDefined();
  await oeffne("KI-News");
  expect(
    screen.getByRole("heading", { level: 2, name: "KI-News" }),
  ).toBeDefined();
  expect(
    screen.getByRole("link", { name: /Introducing Claude/ }),
  ).toBeDefined();
  expect(screen.getByRole("button", { name: "Abmelden" })).toBeDefined();
});

test("zeigt vor der ersten Antwort, dass geladen wird", () => {
  vi.mocked(holeDashboard).mockReturnValue(new Promise(() => {}));
  render(<Page />);
  expect(screen.getByText("Lädt …")).toBeDefined();
});

test("wechselt zum Login, wenn die Sitzung abgelaufen ist", async () => {
  vi.mocked(holeDashboard).mockResolvedValue("abgemeldet");
  render(<Page />);

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
});

test("ein gescheiterter erster Abruf zeigt den Hinweis statt einer leeren Seite", async () => {
  vi.mocked(holeDashboard).mockResolvedValue(null);
  render(<Page />);

  expect(await screen.findByText("Neuer Versuch in 1 Minute.")).toBeDefined();
  expect(screen.queryByText("Lädt …")).toBeNull();
});

test("nach erneutem Versuch verschwindet der Hinweis", async () => {
  vi.mocked(holeDashboard).mockResolvedValueOnce(null).mockResolvedValue(OK);
  render(<Page />);

  fireEvent.click(
    await screen.findByRole("button", { name: "Jetzt erneut versuchen" }),
  );
  await oeffne("KI-News");

  expect(
    await screen.findByRole("heading", { level: 2, name: "KI-News" }),
  ).toBeDefined();
  expect(screen.queryByText("Daten gerade nicht erreichbar.")).toBeNull();
});

test("während des erneuten Versuchs ist der Knopf gesperrt und sagt das", async () => {
  vi.mocked(holeDashboard)
    .mockResolvedValueOnce(null)
    .mockReturnValueOnce(new Promise(() => {}));
  render(<Page />);

  fireEvent.click(
    await screen.findByRole("button", { name: "Jetzt erneut versuchen" }),
  );

  const knopf = await screen.findByRole("button", { name: "Wird versucht …" });
  expect((knopf as HTMLButtonElement).disabled).toBe(true);
});

test("wenn alle Kacheln scheitern, behauptet der Kopf keine Aktualisierung", async () => {
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      {
        id: "ki-news",
        titel: "KI-News",
        aussehen: { farbe: "#8E99A8" },
        status: "fehler",
      },
    ],
  });
  render(<Page />);
  await oeffne("KI-News");

  expect(await screen.findByText("Neuer Versuch in 1 Minute.")).toBeDefined();
  expect(screen.queryByText("Aktualisiert 14:32")).toBeNull();
});

test("eine Kachel unbekannter Art bittet ums Neuladen", async () => {
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      {
        id: "neu",
        titel: "Neu",
        aussehen: { farbe: "#8E99A8" },
        status: "ok",
        daten: { art: "unbekannt" } as unknown as KachelDaten,
        stand: ZEIT,
      },
    ],
  });
  render(<Page />);
  await oeffne("Neu");

  expect(
    await screen.findByText("Neue Kachel, bitte die Seite neu laden."),
  ).toBeDefined();
});

test("↻ holt die Kachel frisch, erneut versuchen und der Takt fragen ohne Argument", async () => {
  vi.mocked(holeDashboard).mockResolvedValueOnce(null).mockResolvedValue(OK);
  render(<Page />);

  fireEvent.click(
    await screen.findByRole("button", { name: "Jetzt erneut versuchen" }),
  );
  await oeffne("KI-News");
  fireEvent.click(
    await screen.findByRole("button", { name: "KI-News aktualisieren" }),
  );

  await waitFor(() => expect(holeDashboard).toHaveBeenCalledTimes(3));
  expect(vi.mocked(holeDashboard).mock.calls).toEqual([
    [undefined],
    [undefined],
    ["ki-news"],
  ]);
});

test("zeigt die Bundesliga-Kachel", async () => {
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      {
        id: "bundesliga",
        titel: "Bundesliga",
        aussehen: { farbe: "#8E99A8" },
        status: "ok",
        daten: {
          art: "fussball",
          titel: "9. Spieltag",
          tage: ["2026-11-08"],
          partien: [],
          tabelle: [],
          meinTeam: ["132"],
          zonen: [],
        },
        stand: ZEIT,
      },
      ...OK.kacheln,
    ],
  });
  render(<Page />);
  await oeffne("Bundesliga");

  expect(
    await screen.findByRole("heading", { level: 2, name: "Bundesliga" }),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { name: "9. Spieltag · So 8. November" }),
  ).toBeDefined();
  await oeffne("KI-News");
  expect(
    screen.getByRole("heading", { level: 2, name: "KI-News" }),
  ).toBeDefined();
});

test("die Fußball-Kacheln stehen unter Sport, die KI-News für sich", async () => {
  const fussball = (id: string, titel: string) => ({
    id,
    titel,
    aussehen: { farbe: "#E3343F" },
    gruppe: "Sport",
    status: "fehler" as const,
  });
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      fussball("bundesliga", "Bundesliga"),
      fussball("premier-league", "Premier League"),
      ...OK.kacheln,
    ],
  });
  render(<Page />);

  await oeffne("Sport");
  const sport = await screen.findByRole("region", { name: "Sport" });
  expect(within(sport).getByRole("heading", { level: 3, name: "Bundesliga" }));
  expect(within(sport).getByRole("heading", { name: "Premier League" }));
  expect(screen.queryByRole("heading", { name: "KI-News" })).toBeNull();
  await oeffne("KI-News");
  expect(screen.getByRole("heading", { level: 2, name: "KI-News" }));
});

test("Kacheln einer Gruppe stehen in einem Reiter, auch wenn sie getrennt eingestellt sind", async () => {
  const fehlerLog = vi.spyOn(console, "error").mockImplementation(() => {});
  const sport = (id: string) => ({
    id,
    titel: id,
    aussehen: { farbe: "#E3343F" },
    gruppe: "Sport",
    status: "fehler" as const,
  });
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [sport("bl"), ...OK.kacheln, sport("pl")],
  });
  render(<Page />);
  await oeffne("Sport");

  const bereich = await screen.findByRole("region", { name: "Sport" });
  expect(within(bereich).getByRole("heading", { name: "bl" })).toBeDefined();
  expect(within(bereich).getByRole("heading", { name: "pl" })).toBeDefined();
  expect(
    fehlerLog.mock.calls.some((aufruf) => String(aufruf[0]).includes("key")),
  ).toBe(false);
  fehlerLog.mockRestore();
});

test("Reiter wechseln zeigt die Kacheln des Reiters und ruft nicht neu ab", async () => {
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      {
        id: "bundesliga",
        titel: "Bundesliga",
        aussehen: { farbe: "#E3343F" },
        gruppe: "Sport",
        status: "fehler",
      },
      ...OK.kacheln,
    ],
  });
  render(<Page />);

  const bereiche = await screen.findByRole("navigation", { name: "Bereiche" });
  const heute = within(bereiche).getByRole("button", { name: "Heute" });
  await waitFor(() => expect(heute.getAttribute("aria-current")).toBe("page"));

  fireEvent.click(within(bereiche).getByRole("button", { name: "Sport" }));
  expect(screen.getByRole("heading", { name: "Bundesliga" })).toBeDefined();
  expect(screen.queryByRole("link", { name: /Introducing Claude/ })).toBeNull();

  fireEvent.click(within(bereiche).getByRole("button", { name: "KI-News" }));
  expect(
    screen.getByRole("link", { name: /Introducing Claude/ }),
  ).toBeDefined();
  expect(screen.queryByRole("heading", { name: "Bundesliga" })).toBeNull();
  expect(holeDashboard).toHaveBeenCalledTimes(1);
});
