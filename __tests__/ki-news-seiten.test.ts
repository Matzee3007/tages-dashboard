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
      nurDatum: true,
    },
    {
      titel: "Teaching AI to build scientific models",
      link: "https://www.anthropic.com/research/teaching-ai",
      zeit: "2026-11-06T00:00:00.000Z",
      nurDatum: true,
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

test("nimmt nur Links mit href aus der eigenen Zeile", () => {
  const html =
    `<html><body><a href="/alles"><ul>` +
    zeile(`<h3>Ohne Link</h3><time>Nov 6, 2026</time>`) +
    zeile(`<h3><a href="/b">B</a></h3><time>Nov 6, 2026</time>`) +
    `</ul></a></body></html>`;
  expect(
    leseSeite("anthropic", html, URL_NEWS).map((meldung) => meldung.link),
  ).toEqual(["https://www.anthropic.com/b"]);
});

test("verwirft unmögliche Tage und Wörter, die nur wie ein Monat beginnen", () => {
  const html = seite(
    zeile(`<h3><a href="/a">A</a></h3><time>Feb 31, 2026</time>`),
    zeile(`<h3><a href="/b">B</a></h3><time>Nov 0, 2026</time>`),
    zeile(`<h3><a href="/c">C</a></h3><time>Mayor 5, 2026</time>`),
    zeile(`<h3><a href="/d">D</a></h3><time>Dec 31, 2026</time>`),
  );
  expect(
    leseSeite("anthropic", html, URL_NEWS).map((meldung) => meldung.titel),
  ).toEqual(["D"]);
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

const URL_ARTIKEL = "https://claude.com/resources/articles";

test("liest Karten von claude.com mit Datum und Titel im Link", () => {
  const html =
    `<html><body><div><a href="/resources/articles/message-threads"><div><span>Article</span>` +
    `<span>Nov 2, 2026</span></div><div><h3>Make long-running agents faster with message threads</h3></div></a>` +
    `<a href="/resources">Resources</a></div></body></html>`;
  expect(leseSeite("claude-artikel", html, URL_ARTIKEL)).toEqual([
    {
      titel: "Make long-running agents faster with message threads",
      link: "https://claude.com/resources/articles/message-threads",
      zeit: "2026-11-02T00:00:00.000Z",
      nurDatum: true,
    },
  ]);
});

const URL_HINWEISE =
  "https://support.claude.com/en/articles/12138966-release-notes";

// Gekürzt nach dem Aufbau von support.claude.com am 2026-11-07.
const block = (inhalt: string) => `<div>${inhalt}</div>`;
const hinweise = (...bloecke: string[]) =>
  `<html><body><header><time>Updated today</time></header><article>${bloecke.join("")}</article></body></html>`;

const HINWEISE = hinweise(
  block(`<h2 id="h_1d835e0105">November 2026</h2>`),
  block(`<h3 id="h_8cd3ee82ce">November 6, 2026</h3>`),
  block(`<p><b>Track spend by cost code with project tags (beta)</b></p>`),
  block(
    `<p>Eligible Enterprise organizations can now tag projects. For more information, see <b><a href="https://support.claude.com/x">Track spend by cost code</a></b>.</p>`,
  ),
  block(`<p> </p>`),
  block(`<h3 id="h_1c75a86390">November 5, 2026</h3>`),
  block(`<p><b>New security and admin controls for Enterprise plans</b></p>`),
  block(`<p>Claude Enterprise has new security features.</p>`),
  block(`<p><b>Personal Finance in Claude</b></p>`),
  block(`<p>We’re rolling out Personal Finance.</p>`),
  block(`<h2 id="h_aa">October 2026</h2>`),
  block(`<h3 id="h_leer">October 21, 2026</h3>`),
  block(`<p>Nur Text ohne fetten Titel.</p>`),
);

test("fasst die Versionshinweise eines Tages zu einer Meldung zusammen", () => {
  expect(leseSeite("versionshinweise", HINWEISE, URL_HINWEISE)[1]).toEqual({
    titel:
      "New security and admin controls for Enterprise plans · Personal Finance in Claude",
    link: `${URL_HINWEISE}#h_1c75a86390`,
    zeit: "2026-11-05T00:00:00.000Z",
    nurDatum: true,
  });
});

test("zählt nur Absätze, die ganz fett sind, als Titel", () => {
  expect(leseSeite("versionshinweise", HINWEISE, URL_HINWEISE)[0]).toEqual({
    titel: "Track spend by cost code with project tags (beta)",
    link: `${URL_HINWEISE}#h_8cd3ee82ce`,
    zeit: "2026-11-06T00:00:00.000Z",
    nurDatum: true,
  });
});

test("erkennt Titel aus mehreren fetten Teilen", () => {
  const html = hinweise(
    block(`<h3 id="h_1">November 6, 2026</h3>`),
    block(`<p><b>New:</b> <b>Projects</b></p>`),
  );
  expect(leseSeite("versionshinweise", html, URL_HINWEISE)[0].titel).toBe(
    "New: Projects",
  );
});

test("überspringt Monatsüberschriften und Tage ohne Eintrag", () => {
  expect(
    leseSeite("versionshinweise", HINWEISE, URL_HINWEISE).map(
      (meldung) => meldung.zeit,
    ),
  ).toEqual(["2026-11-06T00:00:00.000Z", "2026-11-05T00:00:00.000Z"]);
});

test("wirft bei claude-artikel und versionshinweise ohne Meldung", () => {
  const leer =
    "<html><body><article><p>Neu gestaltet</p></article></body></html>";
  expect(() => leseSeite("claude-artikel", leer, URL_ARTIKEL)).toThrow(
    "Keine Meldung auf der Seite gefunden",
  );
  expect(() => leseSeite("versionshinweise", leer, URL_HINWEISE)).toThrow(
    "Keine Meldung auf der Seite gefunden",
  );
});
