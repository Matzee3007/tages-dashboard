import { XMLParser } from "fast-xml-parser";

// nurDatum: Die Quelle nennt nur den Tag, zeit ist dann 00:00 UTC (Seiten ohne Feed).
export type Meldung = {
  titel: string;
  link: string;
  zeit: string;
  nurDatum?: true;
};

type Knoten = Record<string, unknown>;

const parser = new XMLParser({
  ignoreAttributes: false,
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

// Ein Wert kommt als Text oder mit Attributen als Objekt an.
function alsText(wert: unknown): string | null {
  if (typeof wert === "string") return wert.trim() || null;
  if (wert && typeof wert === "object") {
    return alsText((wert as Knoten)["#text"]);
  }
  return null;
}

export function istWebLink(text: string): boolean {
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

function findeZeit(eintrag: Knoten): string | null {
  for (const feld of ["published", "pubDate", "dc:date", "updated"]) {
    const zeit = new Date(alsText(eintrag[feld]) ?? "");
    if (!Number.isNaN(zeit.getTime())) return zeit.toISOString();
  }
  return null;
}

function alsMeldung(eintrag: Knoten): Meldung | null {
  const titel = alsText(eintrag.title);
  const link = findeLink(eintrag.link);
  const zeit = findeZeit(eintrag);
  if (!titel || !link || !zeit) return null;

  return { titel: dekodiere(titel), link, zeit };
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
  const meldungen = eintraege.flatMap((eintrag) => alsMeldung(eintrag) ?? []);
  if (eintraege.length > 0 && meldungen.length === 0) {
    throw new Error("Kein Eintrag des Feeds ist lesbar");
  }
  return meldungen;
}
