import { KACHELN, type KachelEinstellung } from "@/lib/einstellungen";
import { ladeTestkachel } from "@/lib/kacheln/test/laden";
import type { DashboardAntwort, KachelAntwort } from "@/lib/kacheln/typen";

const LADER = { test: ladeTestkachel };

async function ladeKachel(
  einstellung: KachelEinstellung,
  jetzt: Date,
): Promise<KachelAntwort> {
  const { id, titel } = einstellung;
  try {
    const ergebnis = await LADER[einstellung.art](einstellung, jetzt);
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
