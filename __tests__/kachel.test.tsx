import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Kachel } from "@/lib/kacheln/kachel";
import type { KachelAnzeige } from "@/lib/kacheln/typen";

const KACHEL: KachelAnzeige = {
  id: "test",
  titel: "Testkachel",
  zusatz: "Server",
  daten: { art: "test", uhrzeit: "14:31:00" },
  stand: "2026-11-08T13:31:00.000Z",
  fehler: false,
};

afterEach(cleanup);

test("ohne Fehler zeigt die Kachel Titel und Inhalt, aber keinen Hinweis", () => {
  render(
    <Kachel kachel={KACHEL} erneutVersuchen={() => {}}>
      Inhalt
    </Kachel>,
  );
  expect(
    screen.getByRole("heading", { level: 2, name: "Testkachel" }),
  ).toBeDefined();
  expect(screen.getByText("Server")).toBeDefined();
  expect(screen.getByText("Inhalt")).toBeDefined();
  expect(screen.queryByText("Daten gerade nicht erreichbar.")).toBeNull();
});

test("bei einem Fehler bleibt der Inhalt, dazu kommt der letzte Stand", () => {
  render(
    <Kachel kachel={{ ...KACHEL, fehler: true }} erneutVersuchen={() => {}}>
      Inhalt
    </Kachel>,
  );
  expect(screen.getByText("Inhalt")).toBeDefined();
  expect(screen.getByText("Daten gerade nicht erreichbar.")).toBeDefined();
  expect(
    screen.getByText("Letzter Stand von 14:31, neuer Versuch in 1 Minute."),
  ).toBeDefined();
});

test("ein Fehler ohne bisherigen Stand nennt keine Uhrzeit", () => {
  render(
    <Kachel
      kachel={{ ...KACHEL, daten: null, stand: null, fehler: true }}
      erneutVersuchen={() => {}}
    />,
  );
  expect(screen.getByText("Neuer Versuch in 1 Minute.")).toBeDefined();
});

test("der Knopf versucht es erneut", () => {
  const erneutVersuchen = vi.fn();
  render(
    <Kachel
      kachel={{ ...KACHEL, fehler: true }}
      erneutVersuchen={erneutVersuchen}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Jetzt erneut versuchen" }),
  );
  expect(erneutVersuchen).toHaveBeenCalledTimes(1);
});
