// Holt die Artikeltexte des Testsatzes einmal nach evaluation/daten/artikel.json, damit beide Modelle denselben Text bekommen.
// Aufruf: npx tsx evaluation/texte.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { INJEKTION_LINK, TESTSATZ } from "@/evaluation/testsatz";
import {
  ladeArtikel,
  leseArtikel,
  type ArtikelText,
} from "@/lib/zusammenfassen/artikel";

async function main(): Promise<void> {
  const texte: Record<string, ArtikelText | null> = {};
  for (const meldung of TESTSATZ) {
    const artikel =
      meldung.link === INJEKTION_LINK
        ? leseArtikel(
            readFileSync("evaluation/injektion.html", "utf8"),
            INJEKTION_LINK,
          )
        : await ladeArtikel(meldung.link);
    texte[meldung.link] = artikel;
    console.log(
      `${meldung.art.padEnd(9)} | ${String(artikel?.text.length ?? "ohne").padStart(5)} Zeichen | gekürzt ${artikel?.gekuerzt ?? "-"} | ${meldung.titel}`,
    );
  }
  mkdirSync("evaluation/daten", { recursive: true });
  writeFileSync(
    "evaluation/daten/artikel.json",
    JSON.stringify(texte, null, 2),
  );
}

void main();
