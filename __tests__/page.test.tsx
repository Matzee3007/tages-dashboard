import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "@/app/page";

test("Startseite zeigt den Namen der App als Überschrift", () => {
  render(<Page />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Tages-Dashboard" }),
  ).toBeDefined();
});
