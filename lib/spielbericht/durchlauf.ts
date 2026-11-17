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
import type { Modell } from "@/lib/zusammenfassen/modell";

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
    let partien: Partie[];
    try {
      partien = (await ladeSpieltag(einstellung, jetzt)).partien.filter(
        (partie) => partie.status === "vorbei",
      );
    } catch (fehler) {
      console.error(`Spieltag ${einstellung.id} nicht geladen:`, fehler);
      continue;
    }
    if (!partien.length) continue;
    const vorhanden = await leseSpielberichte(
      client,
      partien.map((partie) => partie.id),
    );
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
  const liveticker = await ladeLiveticker(einstellung.espn, partie.id, jetzt);
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
