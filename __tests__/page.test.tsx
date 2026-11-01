import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Page from "@/app/page";

vi.mock("@/app/login/actions", () => ({ abmelden: vi.fn() }));

afterEach(cleanup);

test("Startseite zeigt den Namen der App als Überschrift", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Tages-Dashboard" }),
  ).toBeDefined();
});

test("Startseite zeigt den Knopf zum Abmelden", () => {
  render(<Page />);
  expect(screen.getByRole("button", { name: "Abmelden" })).toBeDefined();
});
