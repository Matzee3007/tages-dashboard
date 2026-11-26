import type { Formel1Einstellung } from "@/lib/einstellungen";
import {
  holeJson,
  NORMAL_SEKUNDEN,
  TAG_SEKUNDEN,
} from "@/lib/kacheln/fussball/abruf";
import {
  F1_ADRESSEN,
  leseErgebnis,
  leseKalender,
  leseQualifying,
  leseSaison,
  leseWertung,
} from "@/lib/kacheln/formel-1/jolpica";
import type {
  Formel1Daten,
  Rennen,
  SessionArt,
} from "@/lib/kacheln/formel-1/typen";
import {
  istWinterpause,
  saisonVorbei,
  waehleRennen,
} from "@/lib/kacheln/formel-1/wochenende";
import { heute } from "@/lib/zeit";

// Bis zu drei Abrufe nacheinander, je 2 Sekunden wie bei der NFL (Review von PR #98). Live-Daten gibt es nicht, deshalb nie „frisch“.
const ZEITLIMIT_MS = 2000;
const TOP = 5;

// Fehlt ein Teil (Ergebnis, Wertung, Saisonstart), bleibt der Rest der Kachel.
async function versuche<T>(
  was: string,
  holen: () => Promise<T>,
): Promise<T | null> {
  try {
    return await holen();
  } catch (fehler) {
    console.error(`Formel 1: ${was} fehlt:`, fehler);
    return null;
  }
}

export async function ladeFormel1(
  einstellung: Formel1Einstellung,
  jetzt: Date,
): Promise<Formel1Daten> {
  const etikett = einstellung.id;
  const hole = (url: string, sekunden: number) =>
    holeJson(url, { sekunden, etikett }, jetzt, {}, ZEITLIMIT_MS);

  const kalenderJson = await hole(F1_ADRESSEN.kalender, TAG_SEKUNDEN);
  const saison = leseSaison(kalenderJson);
  const neue = leseKalender(kalenderJson);
  // Hat die Saison von `current` noch nicht begonnen (Januar bis März), zeigt die Kachel die Vorsaison (Review von PR #100).
  const vorBeginn =
    neue.length === 0 ||
    (istWinterpause(neue, jetzt) && !saisonVorbei(neue, jetzt));
  const alle = vorBeginn
    ? leseKalender(await hole(F1_ADRESSEN.saison(saison - 1), TAG_SEKUNDEN))
    : neue;
  const rennen = waehleRennen(alle, jetzt);
  const winterpause = vorBeginn || istWinterpause(alle, jetzt);
  const vorbei = (art: SessionArt) =>
    rennen.sessions.find((session) => session.art === art)?.status === "vorbei";

  const [ergebnis, fahrer, teams, saisonstart] = await Promise.all([
    versuche("Ergebnis", async () => {
      if (vorbei("rennen")) {
        const zeilen = leseErgebnis(
          await hole(
            F1_ADRESSEN.ergebnis(rennen.saison, rennen.runde),
            NORMAL_SEKUNDEN,
          ),
        );
        if (zeilen.length) return { art: "rennen" as const, zeilen };
      }
      if (!vorbei("qualifying")) return null;
      const zeilen = leseQualifying(
        await hole(
          F1_ADRESSEN.qualifying(rennen.saison, rennen.runde),
          NORMAL_SEKUNDEN,
        ),
      );
      return zeilen.length ? { art: "qualifying" as const, zeilen } : null;
    }),
    versuche("Fahrer-Wertung", async () =>
      leseWertung(
        await hole(F1_ADRESSEN.fahrer(rennen.saison), NORMAL_SEKUNDEN),
        "fahrer",
      ),
    ),
    versuche("Team-Wertung", async () =>
      leseWertung(
        await hole(F1_ADRESSEN.teams(rennen.saison), NORMAL_SEKUNDEN),
        "teams",
      ),
    ),
    winterpause
      ? versuche("Saisonstart", async () => {
          const erstes: Rennen | undefined = vorBeginn
            ? neue[0]
            : leseKalender(
                await hole(F1_ADRESSEN.saison(rennen.saison + 1), TAG_SEKUNDEN),
              )[0];
          if (!erstes) return null;
          const tage = erstes.sessions.map((session) =>
            heute(new Date(session.start)),
          );
          return { name: erstes.name, tage: [...new Set(tage)].sort() };
        })
      : null,
  ]);

  return {
    art: "formel-1",
    rennen,
    letzteRunde: alle.at(-1)!.runde,
    winterpause,
    ergebnis,
    fahrer: fahrer?.zeilen.slice(0, TOP) ?? null,
    teams: teams?.zeilen.slice(0, TOP) ?? null,
    wertungNachRunde: fahrer?.nachRunde ?? teams?.nachRunde ?? null,
    saisonstart,
  };
}
