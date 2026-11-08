import type { AbsenderEinstellung } from "@/lib/einstellungen";
import { leseFeed, type Meldung } from "@/lib/kacheln/ki-news/feed";
import { leseSeite } from "@/lib/kacheln/ki-news/seiten";

const ZWISCHENSPEICHER_SEKUNDEN = 900;
const KANAL_ZEITLIMIT_MS = 5000;
const MELDUNGEN_JE_ABSENDER = 3;
const TAG_MS = 24 * 60 * 60 * 1000;
const SIEBEN_TAGE_MS = 7 * TAG_MS;
const SPEICHER_HOECHSTALTER_MS = 60 * 60 * 1000;

export type AbsenderStand = {
  name: string;
  meldungen: Meldung[];
  letzteMeldung: string | null;
  erreichbar: boolean;
};

type Kanal = { url: string; lese: (text: string) => Meldung[] };

// etikett: id der Kachel. Ihr Knopf ↻ leert damit den Speicher (ADR 0008).
export async function ladeKanal(
  url: string,
  jetzt: Date,
  etikett: string,
  lese: Kanal["lese"],
): Promise<Meldung[]> {
  const antwort = await fetch(url, {
    headers: { "User-Agent": "Tages-Dashboard" },
    next: { revalidate: ZWISCHENSPEICHER_SEKUNDEN, tags: [etikett] },
    signal: AbortSignal.timeout(KANAL_ZEITLIMIT_MS),
  });
  if (!antwort.ok) {
    throw new Error(`Status ${antwort.status}`);
  }
  // Next.js liefert bei einem Ausfall still den alten Stand. Die aufgehobene Date-Zeile verrät ihn.
  const abgerufen = Date.parse(antwort.headers.get("Date") ?? "");
  if (jetzt.getTime() - abgerufen > SPEICHER_HOECHSTALTER_MS) {
    throw new Error(`Gespeicherte Antwort von ${antwort.headers.get("Date")}`);
  }
  return lese(await antwort.text());
}

// Ohne Uhrzeit (00:00 UTC) zählt eine Meldung wie vom Ende ihres Tages, höchstens bis jetzt. Sonst fiele ein
// Beitrag vom Abend hinter alle Feed-Meldungen desselben Tages und aus den 3 Zeilen.
function sortierZeit(meldung: Meldung, jetzt: Date): number {
  const zeit = Date.parse(meldung.zeit);
  return meldung.nurDatum ? Math.min(zeit + TAG_MS - 1, jetzt.getTime()) : zeit;
}

export async function ladeAbsender(
  absender: AbsenderEinstellung,
  jetzt: Date,
  etikett: string,
): Promise<AbsenderStand> {
  const kanaele: Kanal[] = [
    ...absender.feeds.map((url) => ({ url, lese: leseFeed })),
    ...(absender.seiten ?? []).map(({ url, art }) => ({
      url,
      lese: (text: string) => leseSeite(art, text, url),
    })),
  ];
  const ergebnisse = await Promise.allSettled(
    kanaele.map(({ url, lese }) => ladeKanal(url, jetzt, etikett, lese)),
  );

  const geladen: Meldung[] = [];
  ergebnisse.forEach((ergebnis, index) => {
    if (ergebnis.status === "fulfilled") {
      geladen.push(...ergebnis.value);
    } else {
      console.error(
        `Kanal ${kanaele[index].url} ließ sich nicht laden:`,
        ergebnis.reason,
      );
    }
  });

  // Gleicher Titel auf derselben Website: Claude Updates verlinkt mehrere Abschnitte einer Seite
  // mit demselben Titel. Auf verschiedenen Websites sind es eigene Meldungen, z. B. Video und Blog.
  const bekannteLinks = new Set<string>();
  const bekannteTitel = new Set<string>();
  const neuesteZuerst = geladen
    .filter((meldung) => Date.parse(meldung.zeit) <= jetzt.getTime())
    .sort((a, b) => sortierZeit(b, jetzt) - sortierZeit(a, jetzt))
    .filter((meldung) => {
      const titel = `${new URL(meldung.link).host} ${meldung.titel}`;
      if (bekannteLinks.has(meldung.link) || bekannteTitel.has(titel)) {
        return false;
      }
      bekannteLinks.add(meldung.link);
      bekannteTitel.add(titel);
      return true;
    });

  return {
    name: absender.name,
    meldungen: neuesteZuerst
      .filter(
        (meldung) =>
          jetzt.getTime() - sortierZeit(meldung, jetzt) <= SIEBEN_TAGE_MS,
      )
      .slice(0, MELDUNGEN_JE_ABSENDER),
    letzteMeldung: neuesteZuerst[0]?.zeit ?? null,
    erreichbar: ergebnisse.some((ergebnis) => ergebnis.status === "fulfilled"),
  };
}

export async function ladeKiNews(
  absender: AbsenderEinstellung[],
  jetzt: Date,
  etikett: string,
): Promise<AbsenderStand[]> {
  const staende = await Promise.all(
    absender.map((einzeln) => ladeAbsender(einzeln, jetzt, etikett)),
  );
  if (!staende.some((stand) => stand.erreichbar)) {
    throw new Error("Kein Absender ist erreichbar");
  }
  // Wie innerhalb eines Absenders: Eine Seiten-Meldung von heute zählt nicht als 00:00 UTC.
  const neueste = (stand: AbsenderStand) =>
    stand.meldungen[0]
      ? sortierZeit(stand.meldungen[0], jetzt)
      : Date.parse(stand.letzteMeldung ?? "0000");
  return staende.sort((a, b) => neueste(b) - neueste(a));
}
