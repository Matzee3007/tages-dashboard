import { KACHELN, type KachelEinstellung } from "@/lib/einstellungen";
import { ladeFussballKachel } from "@/lib/kacheln/fussball/kachel";
import { ladeKiNewsKachel } from "@/lib/kacheln/ki-news/kachel";
import type {
  DashboardAntwort,
  KachelAntwort,
  KachelDaten,
} from "@/lib/kacheln/typen";
import { mitZeitlimit } from "@/lib/zeitlimit";

// Ein switch statt einer Tabelle: So passt TypeScript jede Einstellung zu ihrem Lader.
function lade(
  einstellung: KachelEinstellung,
  jetzt: Date,
): Promise<{ daten: KachelDaten }> {
  switch (einstellung.art) {
    case "ki-news":
      return ladeKiNewsKachel(einstellung, jetzt);
    case "fussball":
      return ladeFussballKachel(einstellung, jetzt);
  }
}

const KACHEL_ZEITLIMIT_MS = 8000;

async function ladeKachel(
  einstellung: KachelEinstellung,
  jetzt: Date,
): Promise<KachelAntwort> {
  const { id, titel } = einstellung;
  try {
    const ergebnis = await mitZeitlimit(
      lade(einstellung, jetzt),
      KACHEL_ZEITLIMIT_MS,
    );
    return {
      id,
      titel,
      status: "ok",
      ...ergebnis,
      stand: jetzt.toISOString(),
    };
  } catch (fehler) {
    console.error(`Kachel ${id} ließ sich nicht laden:`, fehler);
    return { id, titel, status: "fehler" };
  }
}

export async function ladeDashboard(
  einstellungen: KachelEinstellung[] = KACHELN,
  jetzt: Date = new Date(),
): Promise<DashboardAntwort> {
  return {
    zeit: jetzt.toISOString(),
    kacheln: await Promise.all(
      einstellungen.map((einstellung) => ladeKachel(einstellung, jetzt)),
    ),
  };
}
