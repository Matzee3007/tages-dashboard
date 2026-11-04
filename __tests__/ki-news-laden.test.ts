// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ladeKanal } from "@/lib/kacheln/ki-news/laden";

const FEED = `<rss><channel><item><title>Eins</title><link>https://example.org/1</link><pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate></item></channel></rss>`;

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(FEED));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("ruft mit Zwischenspeicher, Zeitlimit und eigenem Namen ab", async () => {
  const zeitlimit = vi.spyOn(AbortSignal, "timeout");

  const meldungen = await ladeKanal("https://example.org/feed");

  const [url, optionen] = fetchMock.mock.calls[0];
  expect(url).toBe("https://example.org/feed");
  expect(optionen.next).toEqual({ revalidate: 900 });
  expect(optionen.headers["User-Agent"]).toBe("Tages-Dashboard");
  expect(zeitlimit).toHaveBeenCalledWith(5000);
  expect(optionen.signal).toBeInstanceOf(AbortSignal);
  expect(meldungen).toHaveLength(1);
});

test("wirft bei Status 404", async () => {
  fetchMock.mockResolvedValue(new Response("weg", { status: 404 }));
  await expect(ladeKanal("https://example.org/feed")).rejects.toThrow();
});

test("wirft bei Status 200 mit HTML", async () => {
  fetchMock.mockResolvedValue(
    new Response("<!doctype html><html><body>Hallo</body></html>"),
  );
  await expect(ladeKanal("https://example.org/feed")).rejects.toThrow();
});

test("wirft, wenn fetch fehlschlägt", async () => {
  fetchMock.mockRejectedValue(new Error("kein Netz"));
  await expect(ladeKanal("https://example.org/feed")).rejects.toThrow(
    "kein Netz",
  );
});
