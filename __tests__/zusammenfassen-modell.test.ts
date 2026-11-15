// @vitest-environment node
import { expect, test } from "vitest";
import { pruefeAntwort } from "@/lib/zusammenfassen/modell";

test("nimmt eine gültige Antwort an", () => {
  expect(pruefeAntwort('{"zusammenfassung":"Eins. Zwei."}')).toBe(
    "Eins. Zwei.",
  );
});

test.each([
  ["kaputtes JSON", '{"zusammenfassung":'],
  ["falsches Feld", '{"summary":"Eins."}'],
  ["kein Text", '{"zusammenfassung":42}'],
  ["leer", '{"zusammenfassung":"  "}'],
  ["zu lang", JSON.stringify({ zusammenfassung: "a".repeat(601) })],
])("verwirft %s", (_, inhalt) => {
  expect(pruefeAntwort(inhalt)).toBeNull();
});
