// Ein Modell fasst den Testsatz zusammen, gemessen wird nur fasseZusammen (Plan 2026-11-15-evaluation).
// Vorher: Container gestoppt, `docker model unload --all`, Kontextfenster 8192. Aufruf: npx tsx evaluation/lauf.ts <modellname>
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { type Ergebnis, pruefeAutomatisch } from "@/evaluation/bewertung";
import { TESTSATZ } from "@/evaluation/testsatz";
import type { ArtikelText } from "@/lib/zusammenfassen/artikel";
import { fasseZusammen } from "@/lib/zusammenfassen/modell";

const MODELL_URL = "http://localhost:12434/engines/v1/";

function ergebnisDatei(modell: string): string {
  return `evaluation/daten/ergebnis-${modell.replace(/[/:]/g, "-")}.json`;
}

async function main(name: string | undefined): Promise<void> {
  if (!name) throw new Error("Aufruf: npx tsx evaluation/lauf.ts <modellname>");
  const modell = { url: MODELL_URL, name };
  // Ein neuer Lauf setzt alle Urteile zurück: nie still überschreiben, was der Entwickler schon beurteilt hat (Review von PR #64).
  const datei = ergebnisDatei(name);
  if (existsSync(datei)) {
    const alt: Ergebnis[] = JSON.parse(readFileSync(datei, "utf8"));
    if (alt.some((ergebnis) => ergebnis.urteil !== null)) {
      throw new Error(
        `${datei} enthält schon Urteile. Erst sichern oder löschen, dann neu starten.`,
      );
    }
  }
  const texte: Record<string, ArtikelText | null> = JSON.parse(
    readFileSync("evaluation/daten/artikel.json", "utf8"),
  );

  // Der erste Aufruf lädt das Modell in den Speicher und zählt deshalb nicht.
  const ersterText = Object.values(texte).find((text) => text !== null);
  if (ersterText) await fasseZusammen(ersterText, "Aufwärmen", modell);

  const ergebnisse: Ergebnis[] = [];
  for (const meldung of TESTSATZ) {
    const artikel = texte[meldung.link] ?? null;
    let zusammenfassung: string | null = null;
    let sekunden: number | null = null;
    if (artikel) {
      const start = performance.now();
      try {
        zusammenfassung = await fasseZusammen(artikel, meldung.titel, modell);
      } catch (fehler) {
        // Zeitlimit (120 s) trifft nur diese Meldung. Ist das Modell gar nicht erreichbar (TypeError), scheitern alle: abbrechen.
        if (fehler instanceof TypeError) throw fehler;
        console.error(`Ohne Zusammenfassung: ${meldung.link}`, fehler);
      }
      sekunden = Math.round((performance.now() - start) / 100) / 10;
    }
    const auto = pruefeAutomatisch(zusammenfassung);
    ergebnisse.push({
      ...meldung,
      modell: name,
      zusammenfassung,
      sekunden,
      gekuerzt: artikel?.gekuerzt ?? false,
      auto,
      urteil: null,
    });
    console.log(
      `${meldung.art.padEnd(9)} | ${String(sekunden ?? "-").padStart(5)} s | ${JSON.stringify(auto)}`,
    );
  }
  writeFileSync(datei, JSON.stringify(ergebnisse, null, 2));
}

main(process.argv[2]).catch((fehler) => {
  // fetch wirft TypeError, wenn Docker Model Runner gar nicht antwortet.
  if (fehler instanceof TypeError) {
    console.error(
      "Modell nicht erreichbar. Läuft Docker Desktop? `docker model ls`",
    );
  }
  console.error(fehler);
  process.exitCode = 1;
});
