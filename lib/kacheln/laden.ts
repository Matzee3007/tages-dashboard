import { KACHELN, type KachelEinstellung } from "@/lib/einstellungen";
import { ladeTestkachel } from "@/lib/kacheln/test/laden";
import type { DashboardAntwort, KachelAntwort } from "@/lib/kacheln/typen";

const LADER = { test: ladeTestkachel };
const KACHEL_ZEITLIMIT_MS = 8000;

async function mitZeitlimit<T>(ladevorgang: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const zeitlimit = new Promise<never>((_, abbrechen) => {
    timer = setTimeout(
      () => abbrechen(new Error("Zeitlimit überschritten")),
      KACHEL_ZEITLIMIT_MS,
    );
  });
  try {
    return await Promise.race([ladevorgang, zeitlimit]);
  } finally {
    clearTimeout(timer);
  }
}

async function ladeKachel(
  einstellung: KachelEinstellung,
  jetzt: Date,
): Promise<KachelAntwort> {
  const { id, titel } = einstellung;
  try {
    const ergebnis = await mitZeitlimit(
      LADER[einstellung.art](einstellung, jetzt),
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
