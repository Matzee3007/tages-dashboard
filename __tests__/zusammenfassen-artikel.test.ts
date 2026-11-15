// @vitest-environment node
import { afterEach, expect, test, vi } from "vitest";
import { ladeArtikel, leseArtikel } from "@/lib/zusammenfassen/artikel";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

test("Seite ohne Text (Video) ergibt null", () => {
  const html = "<html><body><h1>Video</h1><video></video></body></html>";
  expect(leseArtikel(html, "https://www.youtube.com/watch?v=1")).toBeNull();
});

test("ein hängender Abruf ergibt nach dem Zeitlimit von 10 Sekunden null", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new DOMException("timeout", "TimeoutError")),
  );
  await expect(ladeArtikel("https://example.org/a")).resolves.toBeNull();
  expect(zeitlimit).toHaveBeenCalledWith(10000);
});
