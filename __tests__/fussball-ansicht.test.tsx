import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import type { Zone } from "@/lib/einstellungen";
import { FussballAnsicht } from "@/lib/kacheln/fussball/ansicht";
import type {
  FussballDaten,
  Partie,
  TabellenZeile,
} from "@/lib/kacheln/fussball/typen";

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
    { text: "García 7'", seite: "gast" },
    { text: "Schick 85'", seite: "gast" },
    { text: "El Mala 90+2'", seite: "heim" },
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

const DATEN: FussballDaten = {
  art: "fussball",
  titel: "9. Spieltag",
  tage: ["2026-11-06", "2026-11-07", "2026-11-08"],
  partien: [MAINZ_BAYERN, KOELN_LEVERKUSEN, FREIBURG_UNION],
  tabelle: [zeile(1, "132", "Bayern"), null, zeile(4, "126", "Freiburg")],
  meinTeam: ["132"],
  zonen: [],
};

test("Überschrift mit Nummer und Tagen", () => {
  const { rerender } = render(<FussballAnsicht daten={DATEN} />);
  expect(
    screen.getByRole("heading", {
      name: "9. Spieltag · Fr 6. – So 8. November",
    }),
  ).toBeDefined();

  rerender(<FussballAnsicht daten={{ ...DATEN, titel: null }} />);
  expect(
    screen.getByRole("heading", { name: "Fr 6. – So 8. November" }),
  ).toBeDefined();
});

test("eine Partie zeigt Anstoß, Teams und Ergebnis", () => {
  render(<FussballAnsicht daten={DATEN} />);
  const partie = screen.getByTestId("partie-1");
  expect(partie.textContent).toContain("Sa 15:30");
  expect(partie.textContent).toContain("Mainz");
  expect(partie.textContent).toContain("Bayern");
  expect(partie.textContent).toContain("1:2");
});

test("laufende Partie zeigt die Minute", () => {
  render(<FussballAnsicht daten={DATEN} />);
  const partie = screen.getByTestId("partie-3");
  expect(partie.textContent).toContain("56'");
  expect(partie.querySelector('[aria-label="live"]')).not.toBeNull();
});

test("Torschützen in einer Zeile", () => {
  render(<FussballAnsicht daten={DATEN} />);
  expect(
    screen.getByText("García 7' · Schick 85' · El Mala 90+2'"),
  ).toBeDefined();
});

test("Mein Team ist markiert", () => {
  render(<FussballAnsicht daten={DATEN} />);
  expect(screen.getByTestId("partie-1").hasAttribute("data-mein-team")).toBe(
    true,
  );
  expect(screen.getByTestId("partie-2").hasAttribute("data-mein-team")).toBe(
    false,
  );
  const bayernZeile = screen.getByRole("row", { name: /Bayern/ });
  expect(bayernZeile.hasAttribute("data-mein-team")).toBe(true);
});

const CL = { name: "Champions League", farbe: "#4C8DF6" };
const ZONEN_BL: Zone[] = [
  { von: 1, bis: 4, ...CL },
  { von: 5, bis: 5, name: "Europa League", farbe: "#22B8CF" },
  { von: 6, bis: 6, name: "Conference League", farbe: "#4CC38A" },
  { von: 17, bis: 18, name: "Abstieg", farbe: "#E5484D" },
];

function mitLinien(
  tabelle: (TabellenZeile | null)[],
  zonen: Zone[],
  meinTeam: string[] = [],
) {
  render(<FussballAnsicht daten={{ ...DATEN, tabelle, zonen, meinTeam }} />);
  return screen
    .getAllByRole("row")
    .filter((reihe) => reihe.hasAttribute("data-linie"))
    .map((reihe) => reihe.textContent?.match(/^\d+/)?.[0]);
}

test("nach Platz 4 kommt eine Linie, wenn Platz 5 folgt", () => {
  const tabelle = [
    zeile(1, "1", "Eins"),
    null,
    zeile(3, "3", "Drei"),
    zeile(4, "4", "Vier"),
    zeile(5, "5", "Fünf"),
  ];
  expect(mitLinien(tabelle, [{ von: 1, bis: 4, ...CL }])).toEqual(["4"]);
});

test("keine Linie über eine Lücke", () => {
  const tabelle = [
    zeile(1, "1", "Eins"),
    null,
    zeile(4, "4", "Vier"),
    null,
    zeile(7, "7", "Sieben"),
  ];
  expect(mitLinien(tabelle, [{ von: 1, bis: 4, ...CL }])).toEqual([]);
});

test("bei gleichem Platz steht die Linie unter dem letzten Team davon", () => {
  const tabelle = [
    zeile(3, "3", "Drei"),
    zeile(4, "4", "Vier"),
    zeile(4, "44", "AuchVier"),
    zeile(6, "6", "Sechs"),
  ];
  expect(mitLinien(tabelle, [{ von: 1, bis: 4, ...CL }])).toEqual(["4"]);
  expect(
    screen.getByRole("row", { name: /AuchVier/ }).hasAttribute("data-linie"),
  ).toBe(true);
});

test("Mein Team an der Grenze hat Markierung und Linie", () => {
  mitLinien(
    [zeile(4, "4", "Vier"), zeile(5, "5", "Fünf")],
    [{ von: 1, bis: 4, ...CL }],
    ["4"],
  );
  const reihe = screen.getByRole("row", { name: /Vier/ });
  expect(reihe.hasAttribute("data-mein-team")).toBe(true);
  expect(reihe.hasAttribute("data-linie")).toBe(true);
});

test("jede Zeile trägt ihre Zone", () => {
  mitLinien([zeile(4, "4", "Vier"), zeile(5, "5", "Fünf")], ZONEN_BL);
  expect(
    screen.getByRole("row", { name: /Fünf/ }).getAttribute("data-zone"),
  ).toBe("Europa League");
});

test("die Legende nennt nur die Zonen im Ausschnitt", () => {
  mitLinien(
    [
      zeile(1, "1", "Eins"),
      null,
      zeile(4, "4", "Vier"),
      zeile(5, "5", "Fünf"),
      zeile(6, "6", "Sechs"),
    ],
    ZONEN_BL,
  );
  const legende = screen.getByRole("list", { name: "Zonen" });
  expect(
    within(legende)
      .getAllByRole("listitem")
      .map((eintrag) => eintrag.textContent),
  ).toEqual(["Champions League", "Europa League", "Conference League"]);
});

test("Lücke in der Tabelle", () => {
  render(<FussballAnsicht daten={DATEN} />);
  expect(screen.getByText("···")).toBeDefined();
});

test("ein Logo ohne Bild verschwindet", () => {
  const { container } = render(<FussballAnsicht daten={DATEN} />);
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
  render(<FussballAnsicht daten={{ ...DATEN, partien: [abgesagt] }} />);
  const partie = screen.getByTestId("partie-9");
  expect(partie.textContent).toContain("abgesagt");
  expect(partie.textContent).not.toContain("Sa 15:30");
});

test("ohne Tabelle steht ein Hinweis statt der Tabelle", () => {
  const { container } = render(
    <FussballAnsicht daten={{ ...DATEN, tabelle: null }} />,
  );
  expect(screen.getByText("Tabelle gerade nicht erreichbar")).toBeDefined();
  expect(container.querySelector("table")).toBeNull();
});

test("die Abschnitte folgen der Ebene des Kacheltitels", () => {
  const { rerender } = render(<FussballAnsicht daten={DATEN} />);
  expect(screen.getByRole("heading", { level: 4, name: "Tabelle" }));
  rerender(<FussballAnsicht daten={DATEN} ebene={3} />);
  expect(screen.getByRole("heading", { level: 3, name: "Tabelle" }));
});
