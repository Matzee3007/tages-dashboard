// @vitest-environment node
import { expect, test } from "vitest";
import { leseSeite } from "@/lib/kacheln/ki-news/seiten";

const URL_NEWS = "https://www.anthropic.com/news";

// Gekürzt nach dem Aufbau von anthropic.com am 2026-11-07: bei News umschließt der Link die Überschrift,
// bei Research liegt er in ihr, das Datum steht mal davor, mal danach.
const zeile = (inhalt: string) => `<li data-listing-row="x">${inhalt}</li>`;

const NEWS_ZEILE = zeile(
  `<div><a href="/news/2026-us-midterms"><span><span><h3>Preparing for the 2026 US midterms</h3></span></span></a></div>` +
    `<div><a href="/news/safeguards">Safeguards</a></div><div><time>Oct 14, 2026</time></div>`,
);

const RESEARCH_ZEILE = zeile(
  `<header><p><a href="/science">Science</a></p><time>Nov 6, 2026</time></header>` +
    `<div><h3 data-component="Headline"><a href="/research/teaching-ai">Teaching AI to build scientific models</a></h3></div>`,
);

const seite = (...zeilen: string[]) =>
  `<html><body><ul>${zeilen.join("")}</ul></body></html>`;

test("liest Titel, Link und Datum jeder Zeile einer Anthropic-Seite", () => {
  expect(
    leseSeite("anthropic", seite(NEWS_ZEILE, RESEARCH_ZEILE), URL_NEWS),
  ).toEqual([
    {
      titel: "Preparing for the 2026 US midterms",
      link: "https://www.anthropic.com/news/2026-us-midterms",
      zeit: "2026-10-14T00:00:00.000Z",
    },
    {
      titel: "Teaching AI to build scientific models",
      link: "https://www.anthropic.com/research/teaching-ai",
      zeit: "2026-11-06T00:00:00.000Z",
    },
  ]);
});

test("nimmt den Link an der Überschrift, nicht den Kategorie-Link", () => {
  const links = leseSeite(
    "anthropic",
    seite(NEWS_ZEILE, RESEARCH_ZEILE),
    URL_NEWS,
  ).map((meldung) => meldung.link);
  expect(links).toEqual([
    "https://www.anthropic.com/news/2026-us-midterms",
    "https://www.anthropic.com/research/teaching-ai",
  ]);
});

test("macht relative Links absolut, auch auf einer Unterseite", () => {
  const html = seite(
    zeile(`<h3><a href="/research/x">X</a></h3><time>Nov 6, 2026</time>`),
  );
  const [meldung] = leseSeite(
    "anthropic",
    html,
    "https://www.anthropic.com/research/team/frontier-red-team",
  );
  expect(meldung.link).toBe("https://www.anthropic.com/research/x");
});

test("liest das Datum als 00:00 UTC, kurze und lange Monatsnamen", () => {
  const html = seite(
    zeile(`<h3><a href="/a">A</a></h3><time>Nov 6, 2026</time>`),
    zeile(`<h3><a href="/b">B</a></h3><time>November 6, 2026</time>`),
  );
  expect(
    leseSeite("anthropic", html, URL_NEWS).map((meldung) => meldung.zeit),
  ).toEqual(["2026-11-06T00:00:00.000Z", "2026-11-06T00:00:00.000Z"]);
});

test("dekodiert Zeichen im Titel und zieht Leerraum zusammen", () => {
  const html = seite(
    zeile(
      `<h3><a href="/a">Anthropic&#x27;s\n   plan &amp; more</a></h3><time>Nov 6, 2026</time>`,
    ),
  );
  expect(leseSeite("anthropic", html, URL_NEWS)[0].titel).toBe(
    "Anthropic's plan & more",
  );
});

test("lässt Einträge ohne Web-Link oder ohne Datum weg", () => {
  const html = seite(
    zeile(
      `<h3><a href="javascript:alert(1)">Böse</a></h3><time>Nov 6, 2026</time>`,
    ),
    zeile(`<h3><a href="/bald">Bald</a></h3><time>bald</time>`),
    zeile(`<h3><a href="/leer"> </a></h3><time>Nov 6, 2026</time>`),
    zeile(`<h3><a href="/gut">Gut</a></h3><time>Nov 6, 2026</time>`),
  );
  expect(
    leseSeite("anthropic", html, URL_NEWS).map((meldung) => meldung.titel),
  ).toEqual(["Gut"]);
});

test("wirft, wenn die Seite keine Meldung enthält", () => {
  expect(() =>
    leseSeite(
      "anthropic",
      "<html><body><p>Neu gestaltet</p></body></html>",
      URL_NEWS,
    ),
  ).toThrow("Keine Meldung auf der Seite gefunden");
});
