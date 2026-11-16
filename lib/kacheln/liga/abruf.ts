// Abruf mit Zwischenspeicher für alle Quellen der Liga-Kacheln.

const ABRUF_ZEITLIMIT_MS = 5000;
const STUNDE_MS = 60 * 60 * 1000;

// "frisch": an jedem Speicher vorbei, solange eine Partie läuft. Sonst Speicher in Sekunden, mit dem Etikett der
// Kachel, wenn ihr Knopf ↻ ihn leeren soll (ADR 0008).
export type Speicher = "frisch" | { sekunden: number; etikett?: string };

export async function holeJson(
  url: string,
  speicher: Speicher,
  jetzt: Date,
  header: Record<string, string> = {},
): Promise<unknown> {
  const antwort = await fetch(url, {
    headers: { "User-Agent": "Tages-Dashboard", ...header },
    signal: AbortSignal.timeout(ABRUF_ZEITLIMIT_MS),
    ...(speicher === "frisch"
      ? { cache: "no-store" as const }
      : {
          next: {
            revalidate: speicher.sekunden,
            ...(speicher.etikett && { tags: [speicher.etikett] }),
          },
        }),
  });
  if (!antwort.ok) throw new Error(`Status ${antwort.status} von ${url}`);
  if (speicher !== "frisch") {
    // Next.js liefert bei einem Ausfall still den alten Stand, die aufgehobene Date-Zeile verrät ihn (wie ADR 0005).
    const hoechstalter = Math.max(STUNDE_MS, 2 * speicher.sekunden * 1000);
    const abgerufen = Date.parse(antwort.headers.get("Date") ?? "");
    if (jetzt.getTime() - abgerufen > hoechstalter) {
      throw new Error(
        `Gespeicherte Antwort von ${antwort.headers.get("Date")}: ${url}`,
      );
    }
  }
  return antwort.json();
}
