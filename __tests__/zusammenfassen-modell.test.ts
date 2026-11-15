// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { fasseZusammen, pruefeAntwort } from "@/lib/zusammenfassen/modell";

const MODELL = {
  url: "http://model-runner.docker.internal/v1/",
  name: "ai/test",
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

test("schickt Schema, Modellname und den Artikel als Daten", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      choices: [{ message: { content: '{"zusammenfassung":"Eins."}' } }],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const ergebnis = await fasseZusammen(
    { text: "Artikeltext", gekuerzt: false },
    "Titel",
    MODELL,
  );

  expect(ergebnis).toBe("Eins.");
  const [url, optionen] = fetchMock.mock.calls[0];
  expect(url).toBe("http://model-runner.docker.internal/v1/chat/completions");
  const body = JSON.parse(optionen.body);
  expect(body.model).toBe("ai/test");
  expect(body.response_format.type).toBe("json_schema");
  expect(body.messages.at(-1).content).toContain(
    "<artikel>\nArtikeltext\n</artikel>",
  );
  expect(zeitlimit).toHaveBeenCalledWith(120000);
});
