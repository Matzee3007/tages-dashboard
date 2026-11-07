// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
  ladeAbsender,
  ladeKanal,
  ladeKiNews,
} from "@/lib/kacheln/ki-news/laden";

const FEED = `<rss><channel><item><title>Eins</title><link>https://example.org/1</link><pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate></item></channel></rss>`;

const JETZT = new Date("2026-11-08T12:00:00Z");

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

  const meldungen = await ladeKanal("https://example.org/feed", JETZT);

  const [url, optionen] = fetchMock.mock.calls[0];
  expect(url).toBe("https://example.org/feed");
  expect(optionen.next).toEqual({ revalidate: 900 });
  expect(optionen.headers["User-Agent"]).toBe("Tages-Dashboard");
  expect(zeitlimit).toHaveBeenCalledWith(5000);
  expect(optionen.signal).toBeInstanceOf(AbortSignal);
  expect(meldungen).toHaveLength(1);
});

test("eine gespeicherte Antwort darf höchstens 1 Stunde alt sein", async () => {
  const mitDatum = (datum: string) =>
    new Response(FEED, { headers: { Date: new Date(datum).toUTCString() } });

  fetchMock.mockResolvedValue(mitDatum("2026-11-08T11:00:00Z"));
  await expect(
    ladeKanal("https://example.org/feed", JETZT),
  ).resolves.toHaveLength(1);

  fetchMock.mockResolvedValue(mitDatum("2026-11-08T10:59:59Z"));
  await expect(ladeKanal("https://example.org/feed", JETZT)).rejects.toThrow();
});

test("eine Antwort ohne lesbare Date-Zeile gilt als frisch", async () => {
  fetchMock.mockResolvedValue(
    new Response(FEED, { headers: { Date: "kaputt" } }),
  );
  await expect(
    ladeKanal("https://example.org/feed", JETZT),
  ).resolves.toHaveLength(1);
});

test("wirft bei Status 404", async () => {
  fetchMock.mockResolvedValue(new Response("weg", { status: 404 }));
  await expect(ladeKanal("https://example.org/feed", JETZT)).rejects.toThrow();
});

test("wirft bei Status 200 mit HTML", async () => {
  fetchMock.mockResolvedValue(
    new Response("<!doctype html><html><body>Hallo</body></html>"),
  );
  await expect(ladeKanal("https://example.org/feed", JETZT)).rejects.toThrow();
});

test("wirft, wenn fetch fehlschlägt", async () => {
  fetchMock.mockRejectedValue(new Error("kein Netz"));
  await expect(ladeKanal("https://example.org/feed", JETZT)).rejects.toThrow(
    "kein Netz",
  );
});

type Eintrag = [titel: string, zeit: string, link?: string];

function feed(eintraege: Eintrag[]): string {
  const items = eintraege
    .map(
      ([titel, zeit, link]) =>
        `<item><title>${titel}</title><link>${link ?? `https://example.org/${titel}`}</link><pubDate>${new Date(zeit).toUTCString()}</pubDate></item>`,
    )
    .join("");
  return `<rss><channel>${items}</channel></rss>`;
}

// Eine URL ohne Eintrag schlägt wie ein Netzfehler fehl.
function feedsAntworten(feeds: Record<string, Eintrag[]>) {
  fetchMock.mockImplementation(async (url: string) => {
    if (!feeds[url]) throw new Error("kein Netz");
    return new Response(feed(feeds[url]));
  });
}

function titel(meldungen: { titel: string }[]): string[] {
  return meldungen.map((meldung) => meldung.titel);
}

test("fasst Kanäle zusammen und zeigt die neuesten 3 zuerst", async () => {
  feedsAntworten({
    a: [
      ["zwei", "2026-11-07T12:00:00Z"],
      ["vier", "2026-11-05T12:00:00Z"],
    ],
    b: [
      ["eins", "2026-11-08T11:00:00Z"],
      ["drei", "2026-11-06T12:00:00Z"],
    ],
  });

  const stand = await ladeAbsender({ name: "X", feeds: ["a", "b"] }, JETZT);

  expect(stand.name).toBe("X");
  expect(titel(stand.meldungen)).toEqual(["eins", "zwei", "drei"]);
  expect(stand.letzteMeldung).toBe("2026-11-08T11:00:00.000Z");
  expect(stand.erreichbar).toBe(true);
});

test("zeigt nur Meldungen der letzten 7 Tage", async () => {
  feedsAntworten({
    a: [
      ["genau", "2026-11-01T12:00:00Z"],
      ["zu-alt", "2026-11-01T11:59:59Z"],
    ],
  });

  const stand = await ladeAbsender({ name: "X", feeds: ["a"] }, JETZT);

  expect(titel(stand.meldungen)).toEqual(["genau"]);
});

test("gleicher Link erscheint nur einmal, die neuere Fassung bleibt", async () => {
  const link = "https://example.org/gleich";
  feedsAntworten({
    a: [["alt", "2026-11-06T12:00:00Z", link]],
    b: [["neu", "2026-11-07T12:00:00Z", link]],
  });

  const stand = await ladeAbsender({ name: "X", feeds: ["a", "b"] }, JETZT);

  expect(titel(stand.meldungen)).toEqual(["neu"]);
});

test("gleicher Titel erscheint nur einmal, die neueste Meldung bleibt", async () => {
  feedsAntworten({
    a: [
      ["Release notes", "2026-11-07T12:00:00Z", "https://example.org/n#a"],
      ["Release notes", "2026-11-06T12:00:00Z", "https://example.org/n#b"],
      ["Anderes", "2026-11-05T12:00:00Z"],
    ],
  });

  const stand = await ladeAbsender({ name: "X", feeds: ["a"] }, JETZT);

  expect(titel(stand.meldungen)).toEqual(["Release notes", "Anderes"]);
  expect(stand.meldungen[0].link).toBe("https://example.org/n#a");
});

test("gleicher Titel auf verschiedenen Websites bleibt zweimal", async () => {
  feedsAntworten({
    a: [["Live Q&A", "2026-11-07T12:00:00Z", "https://www.youtube.com/v1"]],
    b: [["Live Q&A", "2026-11-06T12:00:00Z", "https://blog.example.org/qa"]],
  });

  const stand = await ladeAbsender({ name: "X", feeds: ["a", "b"] }, JETZT);

  expect(stand.meldungen.map((meldung) => meldung.link)).toEqual([
    "https://www.youtube.com/v1",
    "https://blog.example.org/qa",
  ]);
});

test("ohne neue Meldung bleibt das Alter der letzten", async () => {
  feedsAntworten({ a: [["alt", "2026-10-16T12:00:00Z"]] });

  const stand = await ladeAbsender({ name: "X", feeds: ["a"] }, JETZT);

  expect(stand).toEqual({
    name: "X",
    meldungen: [],
    letzteMeldung: "2026-10-16T12:00:00.000Z",
    erreichbar: true,
  });
});

test("eine Meldung aus der Zukunft zählt nicht", async () => {
  feedsAntworten({ a: [["zukunft", "2026-11-08T12:00:01Z"]] });

  const stand = await ladeAbsender({ name: "X", feeds: ["a"] }, JETZT);

  expect(stand.meldungen).toEqual([]);
  expect(stand.letzteMeldung).toBeNull();
});

test("fällt ein Kanal aus, zeigt der Absender still den Rest", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const ausgefallen = "https://example.org/ausgefallen";
  feedsAntworten({ b: [["da", "2026-11-07T12:00:00Z"]] });

  const stand = await ladeAbsender(
    { name: "X", feeds: [ausgefallen, "b"] },
    JETZT,
  );

  expect(stand.erreichbar).toBe(true);
  expect(titel(stand.meldungen)).toEqual(["da"]);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0][0]).toContain(ausgefallen);
});

test("ein hängender Kanal fällt nach dem Zeitlimit aus, die anderen laufen weiter", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const echtesZeitlimit = AbortSignal.timeout.bind(AbortSignal);
  vi.spyOn(AbortSignal, "timeout").mockImplementation(() =>
    echtesZeitlimit(10),
  );
  fetchMock.mockImplementation((url: string, optionen: RequestInit) => {
    if (url === "b") {
      return Promise.resolve(
        new Response(feed([["da", "2026-11-07T12:00:00Z"]])),
      );
    }
    return new Promise((_, abbrechen) => {
      optionen.signal?.addEventListener("abort", () =>
        abbrechen(new Error("Zeitlimit")),
      );
    });
  });

  const stand = await ladeAbsender(
    { name: "X", feeds: ["haengt", "b"] },
    JETZT,
  );

  expect(stand.erreichbar).toBe(true);
  expect(titel(stand.meldungen)).toEqual(["da"]);
});

test("ist die gespeicherte Antwort zu alt, zeigt der Absender den Ausfall", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockResolvedValue(
    new Response(FEED, {
      headers: { Date: new Date("2026-11-08T09:00:00Z").toUTCString() },
    }),
  );

  const stand = await ladeAbsender({ name: "X", feeds: ["a"] }, JETZT);

  expect(stand.erreichbar).toBe(false);
});

test("fallen alle Kanäle aus, ist der Absender nicht erreichbar", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  feedsAntworten({});

  const stand = await ladeAbsender({ name: "X", feeds: ["a", "b"] }, JETZT);

  expect(stand).toEqual({
    name: "X",
    meldungen: [],
    letzteMeldung: null,
    erreichbar: false,
  });
});

test("ladeKiNews sortiert nach der neuesten Meldung, nicht Erreichbare und Leere zuletzt", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  feedsAntworten({
    alt: [["a", "2026-10-01T12:00:00Z"]],
    neu: [["n", "2026-11-08T11:00:00Z"]],
    mitte: [["m", "2026-11-05T12:00:00Z"]],
    leer: [],
  });

  const staende = await ladeKiNews(
    [
      { name: "Weg", feeds: ["weg"] },
      { name: "Leer", feeds: ["leer"] },
      { name: "Alt", feeds: ["alt"] },
      { name: "Neu", feeds: ["neu"] },
      { name: "Mitte", feeds: ["mitte"] },
    ],
    JETZT,
  );

  expect(staende.map((stand) => stand.name)).toEqual([
    "Neu",
    "Mitte",
    "Alt",
    "Weg",
    "Leer",
  ]);
});

test("ladeKiNews wirft, wenn kein Absender erreichbar ist", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  feedsAntworten({});

  await expect(
    ladeKiNews([{ name: "X", feeds: ["a"] }], JETZT),
  ).rejects.toThrow();
});

test("ladeKiNews läuft weiter, wenn nur ein Absender ausfällt", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  feedsAntworten({ b: [["da", "2026-11-07T12:00:00Z"]] });

  const staende = await ladeKiNews(
    [
      { name: "A", feeds: ["a"] },
      { name: "B", feeds: ["b"] },
    ],
    JETZT,
  );

  expect(staende.map((stand) => [stand.name, stand.erreichbar])).toEqual([
    ["B", true],
    ["A", false],
  ]);
});

const ANTHROPIC_SEITE = `<html><body><ul><li data-listing-row="x"><h3><a href="/news/seite">seite</a></h3><time>Nov 7, 2026</time></li></ul></body></html>`;

test("ladeKanal nimmt den übergebenen Leser", async () => {
  const lese = vi.fn(() => []);
  fetchMock.mockResolvedValue(new Response("beliebiger Text"));

  await ladeKanal("https://example.org/seite", JETZT, lese);

  expect(lese).toHaveBeenCalledWith("beliebiger Text");
});

test("ein Absender fasst Feeds und Seiten zusammen", async () => {
  fetchMock.mockImplementation(async (url: string) =>
    url === "https://www.anthropic.com/news"
      ? new Response(ANTHROPIC_SEITE)
      : new Response(feed([["feed", "2026-11-08T11:00:00Z"]])),
  );

  const stand = await ladeAbsender(
    {
      name: "X",
      feeds: ["a"],
      seiten: [{ url: "https://www.anthropic.com/news", art: "anthropic" }],
    },
    JETZT,
  );

  expect(
    stand.meldungen.map((meldung) => [meldung.titel, meldung.link]),
  ).toEqual([
    ["feed", "https://example.org/feed"],
    ["seite", "https://www.anthropic.com/news/seite"],
  ]);
});

test("ein Seiten-Kanal fällt aus, die Feeds laufen weiter", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const seite = "https://www.anthropic.com/news";
  fetchMock.mockImplementation(async (url: string) =>
    url === seite
      ? new Response("<html><body>Neu gestaltet</body></html>")
      : new Response(feed([["feed", "2026-11-08T11:00:00Z"]])),
  );

  const stand = await ladeAbsender(
    { name: "X", feeds: ["a"], seiten: [{ url: seite, art: "anthropic" }] },
    JETZT,
  );

  expect(stand.erreichbar).toBe(true);
  expect(titel(stand.meldungen)).toEqual(["feed"]);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log.mock.calls[0][0]).toContain(seite);
});
