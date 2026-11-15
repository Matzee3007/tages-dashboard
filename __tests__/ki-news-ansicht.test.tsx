import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import { KiNewsAnsicht } from "@/lib/kacheln/ki-news/ansicht";

const ANTHROPIC: AbsenderStand = {
  name: "Anthropic",
  meldungen: [
    {
      titel: "Introducing Claude for Financial Services",
      link: "https://www.anthropic.com/news/claude",
      zeit: "2026-11-08T10:32:00.000Z",
    },
    {
      titel: "Responsible Scaling Policy: October 2026 update",
      link: "https://www.anthropic.com/news/rsp",
      zeit: "2026-11-04T08:00:00.000Z",
    },
  ],
  letzteMeldung: "2026-11-08T10:32:00.000Z",
  erreichbar: true,
};

const DECODER: AbsenderStand = {
  name: "The Decoder",
  meldungen: [
    {
      titel: "Europäische KI-Verordnung: Was sich ab Januar ändert",
      link: "https://the-decoder.de/ki-verordnung",
      zeit: "2026-11-06T09:00:00.000Z",
    },
  ],
  letzteMeldung: "2026-11-06T09:00:00.000Z",
  erreichbar: true,
};

const OPENAI_RUHIG: AbsenderStand = {
  name: "OpenAI",
  meldungen: [],
  letzteMeldung: "2026-10-30T12:00:00.000Z",
  erreichbar: true,
};

const POCOCK_OHNE: AbsenderStand = {
  name: "Matt Pocock",
  meldungen: [],
  letzteMeldung: null,
  erreichbar: true,
};

const HACKER_NEWS_WEG: AbsenderStand = {
  name: "Hacker News",
  meldungen: [],
  letzteMeldung: null,
  erreichbar: false,
};

const DATEN = {
  art: "ki-news" as const,
  absender: [ANTHROPIC, DECODER, OPENAI_RUHIG, POCOCK_OHNE, HACKER_NEWS_WEG],
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-08T13:32:00Z") });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test("zeigt je Absender mit Meldung einen Abschnitt mit Links zum Original", () => {
  render(<KiNewsAnsicht daten={DATEN} />);

  expect(
    screen
      .getAllByRole("heading", { level: 3 })
      .map((ueberschrift) => ueberschrift.textContent),
  ).toEqual(["Anthropic", "The Decoder"]);
  const link = screen.getByRole("link", { name: /Introducing Claude/ });
  expect(link.getAttribute("href")).toBe(
    "https://www.anthropic.com/news/claude",
  );
  expect(link.getAttribute("target")).toBe("_blank");
  expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  expect(within(link).getByText("vor 3 Std.")).toBeDefined();
  expect(
    screen.getByText("Europäische KI-Verordnung: Was sich ab Januar ändert"),
  ).toBeDefined();
});

test("nur frische Meldungen tragen den Punkt", () => {
  render(<KiNewsAnsicht daten={DATEN} />);

  expect(
    within(
      screen.getByRole("link", { name: /Introducing Claude/ }),
    ).queryByRole("img", { name: "neu" }),
  ).not.toBeNull();
  expect(
    within(
      screen.getByRole("link", { name: /Responsible Scaling/ }),
    ).queryByRole("img", { name: "neu" }),
  ).toBeNull();
});

test("ein Absender ohne neue Meldung bekommt eine Zeile", () => {
  render(<KiNewsAnsicht daten={DATEN} />);

  expect(screen.getByText("OpenAI")).toBeDefined();
  expect(screen.getByText("zuletzt vor 9 Tagen")).toBeDefined();
  expect(screen.getByText("noch keine Meldung")).toBeDefined();
});

test("ein nicht erreichbarer Absender steht rot da, die anderen nicht", () => {
  render(<KiNewsAnsicht daten={DATEN} />);

  expect(screen.getByText("nicht erreichbar").className).toContain(
    "text-fehler",
  );
  expect(screen.getByText("zuletzt vor 9 Tagen").className).not.toContain(
    "text-fehler",
  );
});

test("ohne neue Meldung gibt es keinen leeren Abschnitt", () => {
  render(
    <KiNewsAnsicht
      daten={{ art: "ki-news", absender: [OPENAI_RUHIG, HACKER_NEWS_WEG] }}
    />,
  );

  expect(screen.queryAllByRole("heading", { level: 3 })).toEqual([]);
  expect(screen.queryAllByRole("link")).toEqual([]);
  expect(screen.getByText("OpenAI")).toBeDefined();
});

test("eine Meldung ohne Uhrzeit zeigt Kalendertage und von gestern den Punkt", () => {
  const seite: AbsenderStand = {
    name: "Anthropic",
    meldungen: [
      {
        titel: "Teaching AI to build scientific models",
        link: "https://www.anthropic.com/research/teaching-ai",
        zeit: "2026-11-07T00:00:00.000Z",
        nurDatum: true,
      },
    ],
    letzteMeldung: "2026-11-07T00:00:00.000Z",
    erreichbar: true,
  };
  render(<KiNewsAnsicht daten={{ art: "ki-news", absender: [seite] }} />);

  const link = screen.getByRole("link", { name: /Teaching AI/ });
  expect(within(link).getByText("gestern")).toBeDefined();
  expect(within(link).queryByRole("img", { name: "neu" })).not.toBeNull();
});

function mitZusammenfassung(zusammenfassung: string) {
  const [erste, zweite] = ANTHROPIC.meldungen;
  return {
    art: "ki-news" as const,
    absender: [
      { ...ANTHROPIC, meldungen: [{ ...erste, zusammenfassung }, zweite] },
    ],
  };
}

test("die Zusammenfassung erscheint erst nach Tipp auf KI, markiert als KI-generiert", () => {
  render(<KiNewsAnsicht daten={mitZusammenfassung("Eins. Zwei.")} />);
  expect(screen.queryByText("Eins. Zwei.")).toBeNull();

  fireEvent.click(
    screen.getByRole("button", { name: "KI-Zusammenfassung aufklappen" }),
  );

  expect(screen.getByText("Eins. Zwei.")).toBeTruthy();
  expect(screen.getByText("KI-generiert")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: /Zum Artikel/ }).getAttribute("href"),
  ).toBe("https://www.anthropic.com/news/claude");
  expect(
    screen.getByRole("button", { name: "KI-Zusammenfassung zuklappen" }),
  ).toBeTruthy();
});

test("HTML in der Zusammenfassung erscheint als Text, nicht als HTML", () => {
  const { container } = render(
    <KiNewsAnsicht daten={mitZusammenfassung("<b>fett</b><img src=x>")} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "KI-Zusammenfassung aufklappen" }),
  );

  expect(screen.getByText("<b>fett</b><img src=x>")).toBeTruthy();
  expect(container.querySelector("b")).toBeNull();
  expect(container.querySelector("img")).toBeNull();
});

test("eine Meldung ohne Zusammenfassung hat keinen Knopf und keine Markierung", () => {
  render(<KiNewsAnsicht daten={DATEN} />);

  expect(
    screen.queryByRole("button", { name: /KI-Zusammenfassung/ }),
  ).toBeNull();
  expect(screen.queryByText("KI-generiert")).toBeNull();
});
