// @vitest-environment node
import { expect, test } from "vitest";
import { leseFeed } from "@/lib/kacheln/ki-news/feed";

function rss(eintraege: string): string {
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>Feed</title>${eintraege}</channel></rss>`;
}

function atom(eintraege: string): string {
  return `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Feed</title>${eintraege}</feed>`;
}

const RSS_EINTRAG = `<item><title>Eins</title><link>https://example.org/1</link><pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate></item>`;

test("liest RSS", () => {
  expect(leseFeed(rss(RSS_EINTRAG + RSS_EINTRAG))).toEqual([
    {
      titel: "Eins",
      link: "https://example.org/1",
      zeit: "2026-11-03T17:01:49.000Z",
    },
    {
      titel: "Eins",
      link: "https://example.org/1",
      zeit: "2026-11-03T17:01:49.000Z",
    },
  ]);
});

test("liest RSS mit Datum aus dc:date", () => {
  const text = `<rss xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><item><title>Eins</title><link>https://example.org/1</link><dc:date>2026-11-03T17:01:49Z</dc:date></item></channel></rss>`;
  expect(leseFeed(text)[0].zeit).toBe("2026-11-03T17:01:49.000Z");
});

test("liest Atom mit mehreren Links und nimmt den alternate-Link", () => {
  const text = atom(`<entry><title>Video</title>
    <link rel="self" href="https://example.org/self"/>
    <link rel="alternate" href="https://example.org/video"/>
    <published>2026-11-03T10:00:00+00:00</published></entry>`);
  expect(leseFeed(text)).toEqual([
    {
      titel: "Video",
      link: "https://example.org/video",
      zeit: "2026-11-03T10:00:00.000Z",
    },
  ]);
});

test("nimmt bei Atom einen Link ohne rel", () => {
  const text = atom(
    `<entry><title>A</title><link href="https://example.org/a"/><published>2026-11-03T10:00:00Z</published></entry>`,
  );
  expect(leseFeed(text)[0].link).toBe("https://example.org/a");
});

test("nimmt bei Atom published und sonst updated", () => {
  const text = atom(`
    <entry><title>A</title><link href="https://example.org/a"/><published>2026-11-01T10:00:00Z</published><updated>2026-11-02T10:00:00Z</updated></entry>
    <entry><title>B</title><link href="https://example.org/b"/><updated>2026-11-03T10:00:00Z</updated></entry>`);
  expect(leseFeed(text).map((meldung) => meldung.zeit)).toEqual([
    "2026-11-01T10:00:00.000Z",
    "2026-11-03T10:00:00.000Z",
  ]);
});

test("versteht einen Feed mit nur einem Eintrag", () => {
  expect(leseFeed(rss(RSS_EINTRAG))).toHaveLength(1);
  expect(
    leseFeed(
      atom(
        `<entry><title>A</title><link href="https://example.org/a"/><updated>2026-11-03T10:00:00Z</updated></entry>`,
      ),
    ),
  ).toHaveLength(1);
});

test("liest Titel in CDATA und Titel, die nur aus Ziffern bestehen", () => {
  const text = rss(`
    <item><title><![CDATA[In CDATA & mehr]]></title><link>https://example.org/1</link><pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate></item>
    <item><title>2026</title><link>https://example.org/2</link><pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate></item>`);
  expect(leseFeed(text).map((meldung) => meldung.titel)).toEqual([
    "In CDATA & mehr",
    "2026",
  ]);
});

test("liest Titel mit Attribut bei Atom", () => {
  const text = atom(
    `<entry><title type="html">Mit Attribut</title><link href="https://example.org/a"/><updated>2026-11-03T10:00:00Z</updated></entry>`,
  );
  expect(leseFeed(text)[0].titel).toBe("Mit Attribut");
});

test("dekodiert auch doppelt kodierte Zeichen", () => {
  const text = rss(
    `<item><title>AT&amp;#038;T &amp;amp; mehr &#8217;x&#x2019;</title><link>https://example.org/1</link><pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate></item>`,
  );
  expect(leseFeed(text)[0].titel).toBe("AT&T & mehr ’x’");
});

test("lässt Einträge ohne Titel, ohne gültiges Datum oder ohne http-Link weg", () => {
  const datum = "<pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate>";
  const text = rss(`
    ${RSS_EINTRAG}
    <item><link>https://example.org/1</link>${datum}</item>
    <item><title>   </title><link>https://example.org/2</link>${datum}</item>
    <item><title>Kein Datum</title><link>https://example.org/3</link></item>
    <item><title>Falsches Datum</title><link>https://example.org/4</link><pubDate>irgendwann</pubDate></item>
    <item><title>Kein Link</title>${datum}</item>
    <item><title>Böser Link</title><link>javascript:alert(1)</link>${datum}</item>
    <item><title>Relativer Link</title><link>/artikel</link>${datum}</item>`);
  expect(leseFeed(text).map((meldung) => meldung.titel)).toEqual(["Eins"]);
});

test("wirft, wenn ein Feed Einträge hat, aber keiner lesbar ist", () => {
  const text = rss(
    `<item><title>Kein Datum</title><link>https://example.org/1</link></item>`,
  );
  expect(() => leseFeed(text)).toThrow();
});

test("nimmt das erste gültige Datum, auch wenn ein Feld davor leer oder kaputt ist", () => {
  const text = atom(`
    <entry><title>A</title><link href="https://example.org/a"/><published></published><updated>2026-11-03T10:00:00Z</updated></entry>
    <entry><title>B</title><link href="https://example.org/b"/><published>irgendwann</published><updated>2026-11-04T10:00:00Z</updated></entry>`);
  expect(leseFeed(text).map((meldung) => meldung.zeit)).toEqual([
    "2026-11-03T10:00:00.000Z",
    "2026-11-04T10:00:00.000Z",
  ]);
});

test("verwechselt media:title nicht mit dem Titel", () => {
  const datum = "<pubDate>Tue, 03 Nov 2026 17:01:49 +0000</pubDate>";
  const text = `<rss xmlns:media="http://search.yahoo.com/mrss/"><channel>
    <item><media:title>Media</media:title><title>Echt</title><link>https://example.org/1</link>${datum}</item>
    <item><title></title><media:title>Media</media:title><link>https://example.org/2</link>${datum}</item>
    <item><title>Zwei</title><link>https://example.org/3</link>${datum}</item>
  </channel></rss>`;
  expect(leseFeed(text).map((meldung) => meldung.titel)).toEqual([
    "Echt",
    "Zwei",
  ]);
});

test("ein leerer Feed ist kein Fehler", () => {
  expect(leseFeed(rss(""))).toEqual([]);
  expect(leseFeed(atom(""))).toEqual([]);
});

test("wirft bei HTML und bei kaputtem Text", () => {
  expect(() =>
    leseFeed("<!doctype html><html><body>Hallo</body></html>"),
  ).toThrow();
  expect(() => leseFeed("kein xml")).toThrow();
  expect(() => leseFeed("")).toThrow();
});
