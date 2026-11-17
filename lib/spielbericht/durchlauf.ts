import type { SupabaseClient } from "@supabase/supabase-js";
import { type FussballEinstellung, KACHELN } from "@/lib/einstellungen";
import { ladeSpieltag } from "@/lib/kacheln/fussball/laden";
import type { Partie } from "@/lib/kacheln/fussball/typen";
import { ladeLiveticker } from "@/lib/spielbericht/liveticker";
import { schreibeBericht } from "@/lib/spielbericht/modell";
import {
  leseSpielberichte,
  speichereSpielbericht,
} from "@/lib/spielbericht/speicher";
import type { Modell } from "@/lib/modell";

// neu: gespeichert. ohne: kein Liveticker, Bericht verworfen oder Fehler; der nächste Durchlauf versucht es neu (ADR 0013).
export async function durchlaufSpielberichte(
  client: SupabaseClient,
  modell: Modell,
  jetzt: Date,
): Promise<{ neu: number; ohne: number }> {
  const ergebnis = { neu: 0, ohne: 0 };
  for (const einstellung of KACHELN) {
    if (einstellung.art !== "fussball") continue;
    // Genau die Partien, die die Kachel zeigt. So holt ein Mac, der aus war, nur den aktuellen Spieltag nach.
    // Ein Fehler bei Spieltag oder Supabase überspringt nur diesen Wettbewerb (Review von PR #85).
    let partien: Partie[];
    let vorhanden: Map<string, string>;
    try {
      partien = (await ladeSpieltag(einstellung, jetzt)).partien.filter(
        (partie) => partie.status === "vorbei",
      );
      if (!partien.length) continue;
      vorhanden = await leseSpielberichte(
        client,
        partien.map((partie) => partie.id),
      );
    } catch (fehler) {
      console.error(`Spielberichte ${einstellung.id} übersprungen:`, fehler);
      continue;
    }
    // Nacheinander: Das Modell auf dem Mac schafft nur eine Anfrage gleichzeitig gut.
    for (const partie of partien) {
      if (vorhanden.has(partie.id)) continue;
      try {
        if (await schreibeEinen(client, modell, einstellung, partie, jetzt)) {
          ergebnis.neu++;
          continue;
        }
      } catch (fehler) {
        // Ist das Modell gar nicht erreichbar (fetch wirft TypeError), scheitert jede weitere Partie auch: abbrechen.
        if (fehler instanceof TypeError) throw fehler;
        console.error(`Ohne Spielbericht: ${partie.id}`, fehler);
      }
      ergebnis.ohne++;
    }
  }
  return ergebnis;
}

// true: gespeichert. false: kein Liveticker oder Bericht verworfen.
async function schreibeEinen(
  client: SupabaseClient,
  modell: Modell,
  einstellung: FussballEinstellung,
  partie: Partie,
  jetzt: Date,
): Promise<boolean> {
  // Ein Netzfehler bei ESPN wirft auch TypeError, betrifft aber nur diese Partie, nicht das Modell (Review von PR #85).
  const liveticker = await ladeLiveticker(
    einstellung.espn,
    partie.id,
    jetzt,
  ).catch((fehler: unknown) => {
    throw new Error(`Liveticker ${partie.id}`, { cause: fehler });
  });
  const bericht =
    liveticker && (await schreibeBericht(partie, liveticker, modell));
  if (!liveticker || !bericht) {
    console.log(
      `Ohne Spielbericht: ${partie.id} (${liveticker ? "Antwort verworfen" : "kein Liveticker"})`,
    );
    return false;
  }
  await speichereSpielbericht(client, {
    partie: partie.id,
    wettbewerb: einstellung.id,
    bericht,
    modell: modell.name,
  });
  return true;
}
