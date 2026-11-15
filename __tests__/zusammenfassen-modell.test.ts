// @vitest-environment node
import { expect, test } from "vitest";
import { pruefeAntwort } from "@/lib/zusammenfassen/modell";

test("nimmt eine gültige Antwort an", () => {
  expect(pruefeAntwort('{"zusammenfassung":"Eins. Zwei."}')).toBe(
    "Eins. Zwei.",
  );
});
