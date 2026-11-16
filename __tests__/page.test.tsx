import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
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
      status: "ok",
      daten: {
        art: "ki-news",
        absender: [
          {
            name: "Anthropic",
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

test("zeigt Datum, Zeit der Aktualisierung, Kachel und Abmelden", async () => {
  vi.mocked(holeDashboard).mockResolvedValue(OK);
  render(<Page />);

  expect(
    await screen.findByRole("heading", {
      level: 1,
      name: "Sonntag, 8. November",
    }),
  ).toBeDefined();
  expect(screen.getByText("Aktualisiert 14:32")).toBeDefined();
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
    kacheln: [{ id: "ki-news", titel: "KI-News", status: "fehler" }],
  });
  render(<Page />);

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
        status: "ok",
        daten: { art: "unbekannt" } as unknown as KachelDaten,
        stand: ZEIT,
      },
    ],
  });
  render(<Page />);

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
        status: "ok",
        daten: {
          art: "liga",
          titel: "9. Spieltag",
          tage: ["2026-11-08"],
          partien: [],
          tabelle: [],
          meinTeam: ["132"],
        },
        stand: ZEIT,
      },
      ...OK.kacheln,
    ],
  });
  render(<Page />);

  expect(
    await screen.findByRole("heading", { level: 2, name: "Bundesliga" }),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { name: "9. Spieltag · So 8. November" }),
  ).toBeDefined();
  expect(
    screen.getByRole("heading", { level: 2, name: "KI-News" }),
  ).toBeDefined();
});
