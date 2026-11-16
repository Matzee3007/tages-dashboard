import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LigaAnsicht } from "@/lib/kacheln/liga/ansicht";
import type {
  LigaDaten,
  Partie,
  TabellenZeile,
} from "@/lib/kacheln/liga/typen";

afterEach(cleanup);

function team(id: string, name: string, tore: number | null) {
  return { id, name, logo: `https://a.espncdn.com/${id}.png`, tore };
}

const MAINZ_BAYERN: Partie = {
  id: "1",
  anstoss: "2026-11-07T14:30:00Z",
  status: "vorbei",
  minute: null,
  heim: team("2950", "Mainz", 1),
  gast: team("132", "Bayern", 2),
  tore: [],
};

const KOELN_LEVERKUSEN: Partie = {
  id: "2",
  anstoss: "2026-11-08T14:30:00Z",
  status: "vorbei",
  minute: null,
  heim: team("122", "Köln", 1),
  gast: team("131", "Leverkusen", 2),
  tore: [
    { text: "García 7'" },
    { text: "Schick 85'" },
    { text: "El Mala 90+2'" },
  ],
};

const FREIBURG_UNION: Partie = {
  id: "3",
  anstoss: "2026-11-08T16:30:00Z",
  status: "laeuft",
  minute: "56'",
  heim: team("126", "Freiburg", 0),
  gast: team("598", "Union", 0),
  tore: [],
};

function zeile(platz: number, id: string, name: string): TabellenZeile {
  return { platz, id, name, logo: null, spiele: 9, differenz: 20, punkte: 21 };
}

const DATEN: LigaDaten = {
  art: "liga",
  titel: "9. Spieltag",
  tage: ["2026-11-06", "2026-11-07", "2026-11-08"],
  partien: [MAINZ_BAYERN, KOELN_LEVERKUSEN, FREIBURG_UNION],
  tabelle: [zeile(1, "132", "Bayern"), null, zeile(4, "126", "Freiburg")],
  meinTeam: ["132"],
};

test("Überschrift mit Nummer und Tagen", () => {
  const { rerender } = render(<LigaAnsicht daten={DATEN} />);
  expect(
    screen.getByRole("heading", {
      name: "9. Spieltag · Fr 6. – So 8. November",
    }),
  ).toBeDefined();

  rerender(<LigaAnsicht daten={{ ...DATEN, titel: null }} />);
  expect(
    screen.getByRole("heading", { name: "Fr 6. – So 8. November" }),
  ).toBeDefined();
});

test("eine Partie zeigt Anstoß, Teams und Ergebnis", () => {
  render(<LigaAnsicht daten={DATEN} />);
  const partie = screen.getByTestId("partie-1");
  expect(partie.textContent).toContain("Sa 15:30");
  expect(partie.textContent).toContain("Mainz");
  expect(partie.textContent).toContain("Bayern");
  expect(partie.textContent).toContain("1:2");
});

test("laufende Partie zeigt die Minute", () => {
  render(<LigaAnsicht daten={DATEN} />);
  const partie = screen.getByTestId("partie-3");
  expect(partie.textContent).toContain("56'");
  expect(partie.querySelector('[aria-label="live"]')).not.toBeNull();
});

test("Torschützen in einer Zeile", () => {
  render(<LigaAnsicht daten={DATEN} />);
  expect(
    screen.getByText("García 7' · Schick 85' · El Mala 90+2'"),
  ).toBeDefined();
});

test("Mein Team ist markiert", () => {
  render(<LigaAnsicht daten={DATEN} />);
  expect(screen.getByTestId("partie-1").hasAttribute("data-mein-team")).toBe(
    true,
  );
  expect(screen.getByTestId("partie-2").hasAttribute("data-mein-team")).toBe(
    false,
  );
  const bayernZeile = screen.getByRole("row", { name: /Bayern/ });
  expect(bayernZeile.hasAttribute("data-mein-team")).toBe(true);
});

test("Lücke in der Tabelle", () => {
  render(<LigaAnsicht daten={DATEN} />);
  expect(screen.getByText("···")).toBeDefined();
});

test("ein Logo ohne Bild verschwindet", () => {
  const { container } = render(<LigaAnsicht daten={DATEN} />);
  const logo = container.querySelector("img")!;
  fireEvent.error(logo);
  expect(logo.style.visibility).toBe("hidden");
});

test("abgesagte Partie zeigt abgesagt statt Anstoß und Ergebnis", () => {
  const abgesagt: Partie = {
    ...MAINZ_BAYERN,
    id: "9",
    status: "abgesagt",
    heim: team("2950", "Mainz", null),
    gast: team("132", "Bayern", null),
  };
  render(<LigaAnsicht daten={{ ...DATEN, partien: [abgesagt] }} />);
  const partie = screen.getByTestId("partie-9");
  expect(partie.textContent).toContain("abgesagt");
  expect(partie.textContent).not.toContain("Sa 15:30");
});

test("ohne Tabelle steht ein Hinweis statt der Tabelle", () => {
  const { container } = render(
    <LigaAnsicht daten={{ ...DATEN, tabelle: null }} />,
  );
  expect(screen.getByText("Tabelle gerade nicht erreichbar")).toBeDefined();
  expect(container.querySelector("table")).toBeNull();
});
