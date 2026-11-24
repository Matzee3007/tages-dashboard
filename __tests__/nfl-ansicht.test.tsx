import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import {
  sortierePartien,
  tabellenAusschnitt,
} from "@/lib/kacheln/fussball/spieltag";
import { NflAnsicht } from "@/lib/kacheln/nfl/ansicht";
import { leseTabellen, leseWoche } from "@/lib/kacheln/nfl/espn";
import type { NflDaten } from "@/lib/kacheln/nfl/typen";
import tabelle from "@/__tests__/fixtures/nfl-tabelle.json";
import woche from "@/__tests__/fixtures/nfl-woche.json";

afterEach(cleanup);

const ZONEN = [
  { von: 1, bis: 4, name: "Division-Sieger", farbe: "#4C8DF6" },
  { von: 5, bis: 7, name: "Wildcard", farbe: "#22B8CF" },
];

function daten(meinTeam: string[], mitTabelle = true): NflDaten {
  const { partien, spielfrei } = leseWoche(
    woche,
    new Date("2026-11-24T02:00:00Z"),
  );
  const { division, conference } = leseTabellen(
    tabelle,
    "NFC West",
    "National Football Conference",
  );
  return {
    art: "nfl",
    titel: "Woche 11",
    tage: ["2026-11-20", "2026-11-22", "2026-11-23", "2026-11-24"],
    partien: sortierePartien(partien, meinTeam),
    spielfrei,
    divisionName: "NFC West",
    division: mitTabelle ? division : null,
    conference: mitTabelle ? tabellenAusschnitt(conference, ["26"]) : null,
    meinTeam,
    zonen: ZONEN,
  };
}

test("Überschrift mit Woche und Tagen, Partien unter dem deutschen Tag", () => {
  render(<NflAnsicht daten={daten(["26"])} />);
  expect(
    screen.getByRole("heading", {
      name: "Woche 11 · Fr 20. – Di 24. November",
    }),
  ).toBeDefined();
  const dienstag = screen.getByRole("group", {
    name: "Dienstag, 24. November",
  });
  const live = within(dienstag).getByTestId(
    `partie-${woche.events.at(-1)!.id}`,
  );
  expect(within(live).getByText("Q3 8:42")).toBeDefined();
});

test("spielfreie Teams am Ende, ist Mein Team spielfrei, steht die Zeile oben und hervorgehoben", () => {
  const { container, rerender } = render(<NflAnsicht daten={daten([])} />);
  let zeile = screen.getByText(/^Spielfrei:/);
  expect(zeile.textContent).toBe(
    "Spielfrei: Falcons, Browns, Packers, Rams, Patriots, Seahawks",
  );
  expect(zeile.closest("[data-mein-team]")).toBeNull();
  const gruppen = container.querySelectorAll('[role="group"]');
  expect(
    zeile.compareDocumentPosition(gruppen[gruppen.length - 1]) &
      Node.DOCUMENT_POSITION_PRECEDING,
  ).toBeTruthy();

  rerender(<NflAnsicht daten={daten(["26"])} />);
  zeile = screen.getByText(/^Spielfrei:/);
  expect(zeile.closest("[data-mein-team]")).not.toBeNull();
  expect(
    zeile.compareDocumentPosition(container.querySelector('[role="group"]')!) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});

test("Tabelle der Division mit Bilanz und Seed, darunter die Conference mit Linie nach Seed 7 und Legende", () => {
  render(<NflAnsicht daten={daten(["26"])} />);
  const division = screen.getByRole("table", { name: "NFC West" });
  const zeilen = within(division).getAllByRole("row").slice(1);
  expect(zeilen).toHaveLength(4);
  expect(zeilen[1].textContent).toContain("Seahawks");
  expect(zeilen[1].textContent).toContain("6–4");
  expect(zeilen[1].getAttribute("data-mein-team")).toBe("true");

  const conference = screen.getByRole("table", { name: "NFC" });
  const seed7 = within(conference)
    .getAllByRole("row")
    .find((zeile) => zeile.getAttribute("data-seed") === "7");
  expect(seed7?.getAttribute("data-linie")).toBe("true");
  const legende = screen.getByRole("list", { name: "Zonen" });
  expect(legende.textContent).toContain("Division-Sieger");
  expect(legende.textContent).toContain("Wildcard");
});

test("ohne Tabelle steht ein Hinweis", () => {
  render(<NflAnsicht daten={daten(["26"], false)} />);
  expect(screen.getByText("Tabelle gerade nicht erreichbar")).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
});

test("ein Spiel nach Mitternacht steht unter dem deutschen Tag mit deutscher Uhrzeit", () => {
  const basis = daten(["26"]);
  const nacht = {
    ...basis.partien[0],
    id: "mnf",
    anstoss: "2026-12-01T01:15Z",
    status: "vorher" as const,
    minute: null,
    heim: { ...basis.partien[0].heim, tore: null },
    gast: { ...basis.partien[0].gast, tore: null },
  };
  render(
    <NflAnsicht daten={{ ...basis, partien: [...basis.partien, nacht] }} />,
  );
  const dienstag = screen.getByRole("group", { name: "Dienstag, 1. Dezember" });
  expect(
    within(within(dienstag).getByTestId("partie-mnf")).getByTestId("feld")
      .textContent,
  ).toBe("02:15");
});

test("Linien nur nach Seed 7 der Conference, nicht in der Division", () => {
  render(<NflAnsicht daten={daten(["26"])} />);
  const division = screen.getByRole("table", { name: "NFC West" });
  expect(division.querySelectorAll("[data-linie]")).toHaveLength(0);
  const conference = screen.getByRole("table", { name: "NFC" });
  expect(
    [...conference.querySelectorAll("[data-linie]")].map((zeile) =>
      zeile.getAttribute("data-seed"),
    ),
  ).toEqual(["7"]);
});
