import { cleanup, render, screen } from "@testing-library/react";
import { useActionState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { LoginFormular } from "@/app/login/login-formular";

vi.mock("@/app/login/actions", () => ({ anmelden: vi.fn() }));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useActionState: vi.fn(),
}));

afterEach(cleanup);

function zeigeFormular(fehler: string | null) {
  vi.mocked(useActionState).mockReturnValue([{ fehler }, vi.fn(), false]);
  render(<LoginFormular />);
}

test("Formular hat Felder für den Schlüsselbund und einen Knopf", () => {
  zeigeFormular(null);
  expect(screen.getByLabelText("E-Mail").getAttribute("autocomplete")).toBe(
    "username",
  );
  expect(screen.getByLabelText("Passwort").getAttribute("autocomplete")).toBe(
    "current-password",
  );
  expect(screen.getByRole("button", { name: "Anmelden" })).toBeDefined();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("Formular zeigt die Fehlermeldung", () => {
  zeigeFormular("E-Mail oder Passwort stimmt nicht.");
  expect(screen.getByRole("alert").textContent).toBe(
    "E-Mail oder Passwort stimmt nicht.",
  );
});
