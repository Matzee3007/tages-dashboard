import type { AbsenderEinstellung } from "@/lib/einstellungen";
import { leseFeed, type Meldung } from "@/lib/kacheln/ki-news/feed";

const ZWISCHENSPEICHER_SEKUNDEN = 900;
const KANAL_ZEITLIMIT_MS = 5000;
const MELDUNGEN_JE_ABSENDER = 3;
const SIEBEN_TAGE_MS = 7 * 24 * 60 * 60 * 1000;
const SPEICHER_HOECHSTALTER_MS = 60 * 60 * 1000;

export type AbsenderStand = {
  name: string;
  meldungen: Meldung[];
  letzteMeldung: string | null;
  erreichbar: boolean;
};

export async function ladeKanal(url: string, jetzt: Date): Promise<Meldung[]> {
  const antwort = await fetch(url, {
    headers: { "User-Agent": "Tages-Dashboard" },
    next: { revalidate: ZWISCHENSPEICHER_SEKUNDEN },
    signal: AbortSignal.timeout(KANAL_ZEITLIMIT_MS),
  });
  if (!antwort.ok) {
    throw new Error(`Status ${antwort.status}`);
  }
  // Next.js liefert bei einem Ausfall still den alten Stand. Die aufgehobene Date-Zeile verrät ihn.
  const abgerufen = Date.parse(antwort.headers.get("Date") ?? "");
  console.log(
    `[DEBUG-c7e1] ${url} Alter ${Math.round((jetzt.getTime() - abgerufen) / 1000)} s`,
  );
  if (jetzt.getTime() - abgerufen > SPEICHER_HOECHSTALTER_MS) {
    throw new Error(`Gespeicherte Antwort von ${antwort.headers.get("Date")}`);
  }
  return leseFeed(await antwort.text());
}

export async function ladeAbsender(
  absender: AbsenderEinstellung,
  jetzt: Date,
): Promise<AbsenderStand> {
  const ergebnisse = await Promise.allSettled(
    absender.feeds.map((url) => ladeKanal(url, jetzt)),
  );

  const geladen: Meldung[] = [];
  ergebnisse.forEach((ergebnis, index) => {
    if (ergebnis.status === "fulfilled") {
      geladen.push(...ergebnis.value);
    } else {
      console.error(
        `Kanal ${absender.feeds[index]} ließ sich nicht laden:`,
        ergebnis.reason,
      );
    }
  });

  // Gleicher Titel: Claude Updates verlinkt mehrere Abschnitte einer Seite mit demselben Titel.
  const bekannteLinks = new Set<string>();
  const bekannteTitel = new Set<string>();
  const neuesteZuerst = geladen
    .filter((meldung) => Date.parse(meldung.zeit) <= jetzt.getTime())
    .sort((a, b) => Date.parse(b.zeit) - Date.parse(a.zeit))
    .filter((meldung) => {
      if (bekannteLinks.has(meldung.link) || bekannteTitel.has(meldung.titel)) {
        return false;
      }
      bekannteLinks.add(meldung.link);
      bekannteTitel.add(meldung.titel);
      return true;
    });

  return {
    name: absender.name,
    meldungen: neuesteZuerst
      .filter(
        (meldung) =>
          jetzt.getTime() - Date.parse(meldung.zeit) <= SIEBEN_TAGE_MS,
      )
      .slice(0, MELDUNGEN_JE_ABSENDER),
    letzteMeldung: neuesteZuerst[0]?.zeit ?? null,
    erreichbar: ergebnisse.some((ergebnis) => ergebnis.status === "fulfilled"),
  };
}

export async function ladeKiNews(
  absender: AbsenderEinstellung[],
  jetzt: Date,
): Promise<AbsenderStand[]> {
  const start = Date.now();
  const staende = await Promise.all(
    absender.map((einzeln) => ladeAbsender(einzeln, jetzt)),
  );
  console.log(`[DEBUG-c7e1] ladeKiNews ${Date.now() - start} ms`);
  if (!staende.some((stand) => stand.erreichbar)) {
    throw new Error("Kein Absender ist erreichbar");
  }
  return staende.sort(
    (a, b) =>
      Date.parse(b.letzteMeldung ?? "0000") -
      Date.parse(a.letzteMeldung ?? "0000"),
  );
}
