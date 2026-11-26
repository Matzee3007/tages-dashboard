import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Formel1Ansicht } from "@/lib/kacheln/formel-1/ansicht";
import {
  leseErgebnis,
  leseKalender,
  leseQualifying,
  leseWertung,
} from "@/lib/kacheln/formel-1/jolpica";
import type { Formel1Daten } from "@/lib/kacheln/formel-1/typen";
import { waehleRennen } from "@/lib/kacheln/formel-1/wochenende";
import ergebnis from "@/__tests__/fixtures/f1-ergebnis.json";
import fahrer from "@/__tests__/fixtures/f1-fahrer.json";
import kalender from "@/__tests__/fixtures/f1-kalender.json";
import qualifying from "@/__tests__/fixtures/f1-qualifying.json";
import teams from "@/__tests__/fixtures/f1-teams.json";

afterEach(cleanup);

const ALLE = leseKalender(kalender);

function daten(
  jetzt: string,
  zusatz: Partial<Formel1Daten> = {},
): Formel1Daten {
  return {
    art: "formel-1",
    rennen: waehleRennen(ALLE, new Date(jetzt)),
    letzteRunde: 23,
    winterpause: false,
    ergebnis: null,
    fahrer: leseWertung(fahrer, "fahrer").zeilen.slice(0, 5),
    teams: leseWertung(teams, "teams").zeilen.slice(0, 5),
    wertungNachRunde: 21,
    saisonstart: null,
    ...zusatz,
  };
}

test("Kopf mit Name, Ort, Runde und Tagen, Sessions mit Wochentag und Uhrzeit", () => {
  render(<Formel1Ansicht daten={daten("2026-11-25T10:00:00Z")} />);
  expect(screen.getByText("Großer Preis von Katar · Lusail")).toBeDefined();
  expect(
    screen.getByText("Runde 22 von 23 · Fr 27. – So 29. November"),
  ).toBeDefined();
  const sessions = screen.getByRole("list", { name: "Rennwochenende" });
  const zeilen = within(sessions).getAllByRole("listitem");
  expect(zeilen.map((z) => z.textContent)).toEqual([
    "1. TrainingFr 14:30",
    "2. TrainingFr 18:00",
    "3. TrainingSa 15:30",
    "QualifyingSa 19:00",
    "RennenSo 17:00",
  ]);
  expect(zeilen[0].getAttribute("data-naechste")).toBe("true");
});

test("nach dem Qualifying: gehakt, Rennen als nächste, Startaufstellung mit 10 Zeilen", () => {
  render(
    <Formel1Ansicht
      daten={daten("2026-11-28T19:30:00Z", {
        ergebnis: { art: "qualifying", zeilen: leseQualifying(qualifying) },
      })}
    />,
  );
  const zeilen = within(
    screen.getByRole("list", { name: "Rennwochenende" }),
  ).getAllByRole("listitem");
  expect(zeilen[3].getAttribute("data-status")).toBe("vorbei");
  expect(zeilen[4].getAttribute("data-naechste")).toBe("true");
  const tabelle = screen.getByRole("table", { name: "Startaufstellung" });
  expect(within(tabelle).getAllByRole("row")).toHaveLength(11);
  expect(tabelle.textContent).toContain("1:33,893");
});

test("während des Rennens steht „läuft“ an der Session", () => {
  render(<Formel1Ansicht daten={daten("2026-11-29T16:30:00Z")} />);
  const rennen = within(
    screen.getByRole("list", { name: "Rennwochenende" }),
  ).getAllByRole("listitem")[4];
  expect(rennen.getAttribute("data-status")).toBe("laeuft");
  expect(rennen.textContent).toContain("läuft");
});

test("Rennergebnis, Fahrer und Teams mit je 5 Zeilen und Runde", () => {
  render(
    <Formel1Ansicht
      daten={daten("2026-11-30T10:00:00Z", {
        ergebnis: { art: "rennen", zeilen: leseErgebnis(ergebnis) },
      })}
    />,
  );
  expect(
    screen.getByRole("table", { name: "Rennergebnis" }).textContent,
  ).toContain("+0,639");
  expect(
    within(screen.getByRole("table", { name: "Fahrer" })).getAllByRole("row"),
  ).toHaveLength(6);
  expect(
    within(screen.getByRole("table", { name: "Teams" })).getAllByRole("row"),
  ).toHaveLength(6);
  expect(screen.getByText("WM-Wertung nach Runde 21")).toBeDefined();
});

test("Winterpause: keine Sessions, Hinweis mit Saisonstart, wenn bekannt", () => {
  const winter = daten("2026-12-09T08:00:00Z", {
    winterpause: true,
    ergebnis: { art: "rennen", zeilen: leseErgebnis(ergebnis) },
  });
  const { rerender } = render(<Formel1Ansicht daten={winter} />);
  expect(screen.queryByRole("list", { name: "Rennwochenende" })).toBeNull();
  expect(screen.getByText("Winterpause.")).toBeDefined();
  expect(screen.queryByText(/Saisonstart/)).toBeNull();

  rerender(
    <Formel1Ansicht
      daten={{
        ...winter,
        saisonstart: {
          name: "Großer Preis von Australien",
          tage: ["2027-03-05", "2027-03-07"],
        },
      }}
    />,
  );
  expect(
    screen.getByText(
      /Saisonstart: Großer Preis von Australien, Fr 5. – So 7. März/,
    ),
  ).toBeDefined();
});

test("ohne Wertung ein Hinweis", () => {
  render(
    <Formel1Ansicht
      daten={daten("2026-11-25T10:00:00Z", {
        fahrer: null,
        teams: null,
        wertungNachRunde: null,
      })}
    />,
  );
  expect(screen.getByText("WM-Wertung gerade nicht erreichbar")).toBeDefined();
});
