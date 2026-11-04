import { XMLParser } from "fast-xml-parser";

export type Meldung = { titel: string; link: string; zeit: string };

type Knoten = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  htmlEntities: true,
  isArray: (name) => ["item", "entry", "link"].includes(name),
});

const BENANNTE_ZEICHEN: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

// Manche Feeds kodieren doppelt: Aus &amp;#038; wird beim Parsen erst &#038;.
function dekodiere(text: string): string {
  return text.replace(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|lt|gt|quot|apos));/gi,
    (ganz, dezimal, hex, name) => {
      if (name) return BENANNTE_ZEICHEN[name.toLowerCase()];
      const zeichen = dezimal ? parseInt(dezimal, 10) : parseInt(hex, 16);
      return zeichen <= 0x10ffff ? String.fromCodePoint(zeichen) : ganz;
    },
  );
}

// Ein Wert kommt als Text, mit Attributen als Objekt oder mehrfach als Liste an.
function alsText(wert: unknown): string | null {
  if (Array.isArray(wert)) return alsText(wert[0]);
  if (typeof wert === "string") return wert.trim() || null;
  if (wert && typeof wert === "object") {
    return alsText((wert as Knoten)["#text"]);
  }
  return null;
}

function istWebLink(text: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(text).protocol);
  } catch {
    return false;
  }
}

function findeLink(links: unknown): string | null {
  for (const link of Array.isArray(links) ? links : []) {
    const kandidat =
      typeof link === "object" && link !== null && "@_href" in link
        ? ["alternate", undefined].includes((link as Knoten)["@_rel"] as string)
          ? alsText((link as Knoten)["@_href"])
          : null
        : alsText(link);
    if (kandidat && istWebLink(kandidat)) return kandidat;
  }
  return null;
}

function alsMeldung(eintrag: Knoten): Meldung | null {
  const titel = alsText(eintrag.title);
  const link = findeLink(eintrag.link);
  const datum = alsText(
    eintrag.published ?? eintrag.pubDate ?? eintrag.date ?? eintrag.updated,
  );
  if (!titel || !link || !datum) return null;

  const zeit = new Date(datum);
  if (Number.isNaN(zeit.getTime())) return null;

  return { titel: dekodiere(titel), link, zeit: zeit.toISOString() };
}

export function leseFeed(text: string): Meldung[] {
  const wurzel = parser.parse(text) as {
    rss?: { channel?: { item?: Knoten[] } };
    feed?: { entry?: Knoten[] };
  };
  if (!wurzel.rss && !wurzel.feed) {
    throw new Error("Der Text ist weder RSS noch Atom");
  }
  const eintraege = wurzel.rss?.channel?.item ?? wurzel.feed?.entry ?? [];
  return eintraege.flatMap((eintrag) => alsMeldung(eintrag) ?? []);
}
