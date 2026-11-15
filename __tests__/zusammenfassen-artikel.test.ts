// @vitest-environment node
import { expect, test } from "vitest";
import { leseArtikel } from "@/lib/zusammenfassen/artikel";

test("löst den Haupttext heraus und lässt Menü und Fußzeile weg", () => {
  const html = `<html><body><nav>Menü</nav><article><h1>Titel</h1><p>${"Satz eins. ".repeat(40)}</p></article><footer>Impressum</footer></body></html>`;
  const artikel = leseArtikel(html, "https://example.org/a");
  expect(artikel?.text).toContain("Satz eins.");
  expect(artikel?.text).not.toContain("Impressum");
  expect(artikel?.gekuerzt).toBe(false);
});

test("kürzt auf 20.000 Zeichen und merkt sich das", () => {
  const html = `<article><p>${"Wort ".repeat(6000)}</p></article>`;
  const artikel = leseArtikel(html, "https://example.org/a");
  expect(artikel?.text.length).toBe(20000);
  expect(artikel?.gekuerzt).toBe(true);
});
