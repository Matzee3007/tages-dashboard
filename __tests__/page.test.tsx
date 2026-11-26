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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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

const BUNDESLIGA_LIVE: DashboardAntwort["kacheln"][number] = {
  id: "bundesliga",
  titel: "Bundesliga",
  aussehen: { farbe: "#E3343F", kuerzel: "BL" },
  gruppe: "Sport",
  status: "ok",
  daten: {
    art: "fussball",
    titel: "12. Spieltag",
    tage: ["2026-11-08"],
    partien: [
      {
        id: "bl-live",
        anstoss: "2026-11-08T12:30:00.000Z",
        status: "laeuft",
        minute: "35'",
        heim: { id: "132", name: "Bayern", logo: null, tore: 1 },
        gast: { id: "28", name: "Union", logo: null, tore: 0 },
        tore: [],
      },
    ],
    tabelle: [
      {
        platz: 1,
        id: "132",
        name: "Bayern",
        logo: null,
        spiele: 11,
        differenz: 30,
        punkte: 31,
      },
    ],
    meinTeam: ["132"],
    zonen: [],
  },
  stand: ZEIT,
};

test("Heute zeigt Jetzt live, Mein Team mit Platz und neue KI-News", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(ZEIT) });
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [BUNDESLIGA_LIVE, ...OK.kacheln],
  });
  render(<Page />);

  const live = await screen.findByRole("region", { name: "Jetzt live" });
  expect(within(live).getByTestId("partie-bl-live")).toBeDefined();
  const meinTeam = screen.getByRole("region", { name: "Mein Team" });
  expect(within(meinTeam).getByText("Platz 1 · 31 Pkt")).toBeDefined();
  const neu = screen.getByRole("region", { name: "Neu in den KI-News" });
  expect(
    within(neu).getByRole("link", { name: /Introducing Claude/ }),
  ).toBeDefined();
  const bereiche = screen.getByRole("navigation", { name: "Bereiche" });
  expect(
    within(bereiche).getByRole("button", { name: "KI-News, 1 neu" }),
  ).toBeDefined();
  expect(
    within(bereiche).getByRole("button", { name: "Sport, live" }),
  ).toBeDefined();
  expect(
    within(live).getByTestId("partie-bl-live").getAttribute("data-mein-team"),
  ).toBe("true");
  vi.useRealTimers();
});

test("Heute ohne laufende Partie und ohne Neues: keine Karte Jetzt live, Hinweis bei den KI-News", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-20T12:00:00Z") });
  vi.mocked(holeDashboard).mockResolvedValue(OK);
  render(<Page />);

  const neu = await screen.findByRole("region", { name: "Neu in den KI-News" });
  expect(within(neu).getByText("Gerade nichts Neues")).toBeDefined();
  expect(within(neu).getByText("Keine neue Meldung")).toBeDefined();
  expect(screen.queryByRole("region", { name: "Jetzt live" })).toBeNull();
  vi.useRealTimers();
});

test("Heute mit einer Kachel im Fehler zeigt die übrigen", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(ZEIT) });
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      {
        id: "bundesliga",
        titel: "Bundesliga",
        aussehen: { farbe: "#E3343F", kuerzel: "BL" },
        gruppe: "Sport",
        status: "fehler",
      },
      ...OK.kacheln,
    ],
  });
  render(<Page />);

  expect(
    await screen.findByRole("region", { name: "Neu in den KI-News" }),
  ).toBeDefined();
  expect(screen.queryByRole("region", { name: "Mein Team" })).toBeNull();
  vi.useRealTimers();
});

test("aus Heute in den Reiter springen, über einen Wettbewerb bis zu seiner Kachel", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(ZEIT) });
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [BUNDESLIGA_LIVE, ...OK.kacheln],
  });
  render(<Page />);
  const bereiche = await screen.findByRole("navigation", { name: "Bereiche" });
  const aktiv = () =>
    within(bereiche)
      .getAllByRole("button")
      .find((knopf) => knopf.getAttribute("aria-current") === "page")
      ?.textContent;

  const live = await screen.findByRole("region", { name: "Jetzt live" });
  fireEvent.click(within(live).getByRole("button", { name: /Bundesliga/ }));
  expect(aktiv()).toMatch(/^Sport/);
  await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  expect(scrollIntoView.mock.contexts[0]).toBe(
    document.getElementById("bundesliga"),
  );

  fireEvent.click(within(bereiche).getByRole("button", { name: "Heute" }));
  fireEvent.click(
    screen.getByRole("button", { name: /Alle Meldungen im Reiter KI-News/ }),
  );
  expect(aktiv()).toMatch(/^KI-News/);

  fireEvent.click(within(bereiche).getByRole("button", { name: "Heute" }));
  fireEvent.click(
    screen.getByRole("button", { name: /Alles im Reiter Sport/ }),
  );
  expect(aktiv()).toMatch(/^Sport/);
});

test("Links zu Artikeln in Heute öffnen die Quelle, nicht den Reiter", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(ZEIT) });
  vi.mocked(holeDashboard).mockResolvedValue(OK);
  render(<Page />);

  const link = await screen.findByRole("link", { name: /Introducing Claude/ });
  expect(link.getAttribute("href")).toBe(
    "https://www.anthropic.com/news/claude",
  );
  expect(link.getAttribute("target")).toBe("_blank");
});

test("Mein Team zeigt Name, nächste Partie mit Anstoß und Chips je Wettbewerb mit Marke", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(ZEIT) });
  const daten = BUNDESLIGA_LIVE.status === "ok" && BUNDESLIGA_LIVE.daten;
  if (!daten || daten.art !== "fussball") throw new Error("Testdaten");
  const naechste = {
    ...daten.partien[0],
    id: "cl-naechste",
    anstoss: "2026-11-25T20:00:00.000Z",
    status: "vorher" as const,
    minute: null,
    heim: { id: "132", name: "Bayern", logo: null, tore: null },
    gast: { id: "359", name: "Arsenal", logo: null, tore: null },
  };
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      BUNDESLIGA_LIVE,
      {
        ...BUNDESLIGA_LIVE,
        id: "champions-league",
        titel: "Champions League",
        aussehen: { farbe: "#5B8DEF", kuerzel: "CL" },
        daten: { ...daten, partien: [naechste] },
      },
    ],
  });
  render(<Page />);

  const meinTeam = await screen.findByRole("region", { name: "Mein Team" });
  expect(within(meinTeam).getByText("Bayern", { selector: "p" })).toBeDefined();
  const cl = within(meinTeam).getByTestId("partie-cl-naechste");
  expect(within(cl).getByTestId("feld").textContent).toBe("21:00");
  expect(within(meinTeam).getByTestId("partie-bl-live")).toBeDefined();
  expect(within(meinTeam).getAllByText("Platz 1 · 31 Pkt")).toHaveLength(2);
  expect(within(meinTeam).getAllByText("BL").length).toBeGreaterThan(0);
  expect(within(meinTeam).getAllByText("CL").length).toBeGreaterThan(0);
});

test("Neu in den KI-News zeigt die neueste groß und höchstens 6 weitere", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(ZEIT) });
  const meldungen = Array.from({ length: 9 }, (_, i) => ({
    titel: `Meldung ${i + 1}`,
    link: `https://example.com/${i + 1}`,
    zeit: new Date(Date.parse(ZEIT) - (i + 1) * 60_000).toISOString(),
  }));
  vi.mocked(holeDashboard).mockResolvedValue({
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
              meldungen,
              letzteMeldung: meldungen[0].zeit,
              erreichbar: true,
            },
          ],
        },
        stand: ZEIT,
      },
    ],
  });
  render(<Page />);

  const neu = await screen.findByRole("region", { name: "Neu in den KI-News" });
  expect(within(neu).getByRole("heading", { name: "Meldung 1" })).toBeDefined();
  expect(within(neu).getAllByRole("link")).toHaveLength(7);
  expect(within(neu).queryByRole("link", { name: /Meldung 8/ })).toBeNull();
});

test("ohne neue Meldung führt der Knopf trotzdem in den Reiter KI-News", async () => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-20T12:00:00Z") });
  vi.mocked(holeDashboard).mockResolvedValue(OK);
  render(<Page />);

  fireEvent.click(
    await screen.findByRole("button", {
      name: /Alle Meldungen im Reiter KI-News/,
    }),
  );
  expect(
    within(screen.getByRole("navigation", { name: "Bereiche" }))
      .getByRole("button", { name: "KI-News" })
      .getAttribute("aria-current"),
  ).toBe("page");
});

test("Heute nennt Kacheln, die gerade nicht erreichbar sind, und führt zu ihnen", async () => {
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

  const hinweis = await screen.findByRole("region", {
    name: "Gerade nicht erreichbar",
  });
  fireEvent.click(within(hinweis).getByRole("button", { name: /KI-News/ }));
  expect(await screen.findByText("Neuer Versuch in 1 Minute.")).toBeDefined();
});

test("Heute zeigt eine laufende Session der Formel 1 unter Jetzt live", async () => {
  vi.mocked(holeDashboard).mockResolvedValue({
    zeit: ZEIT,
    kacheln: [
      {
        id: "formel-1",
        titel: "Formel 1",
        aussehen: { farbe: "#0E8F82", kuerzel: "F1" },
        gruppe: "Sport",
        status: "ok",
        daten: {
          art: "formel-1",
          rennen: {
            saison: 2026,
            runde: 22,
            name: "Großer Preis von Katar",
            ort: "Lusail",
            sessions: [
              { art: "rennen", name: "Rennen", start: ZEIT, status: "laeuft" },
            ],
          },
          letzteRunde: 23,
          winterpause: false,
          ergebnis: null,
          fahrer: null,
          teams: null,
          wertungNachRunde: null,
          saisonstart: null,
        },
        stand: ZEIT,
      },
    ],
  });
  render(<Page />);

  const live = await screen.findByRole("region", { name: "Jetzt live" });
  expect(within(live).getByRole("button", { name: /Formel 1/ })).toBeDefined();
  expect(
    within(live).getByText("Rennen läuft · Großer Preis von Katar"),
  ).toBeDefined();
  expect(
    within(live).getByRole("button", { name: /Alles im Reiter Sport/ }),
  ).toBeDefined();
});
