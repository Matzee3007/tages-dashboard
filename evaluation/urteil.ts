// Fragt die Urteile blind ab: gemischt über alle Modelle, ohne Modellnamen (Plan 2026-11-15-evaluation).
// Jede Antwort wird sofort gespeichert, ein Abbruch mit Ctrl-C verliert nichts. Aufruf: npx tsx evaluation/urteil.ts
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import type { Ergebnis } from "@/evaluation/bewertung";
import { INJEKTION_LINK } from "@/evaluation/testsatz";

const ORDNER = "evaluation/daten";

async function main(): Promise<void> {
  const dateien = new Map<string, Ergebnis[]>();
  for (const name of readdirSync(ORDNER)) {
    if (!name.startsWith("ergebnis-") || !name.endsWith(".json")) continue;
    const pfad = `${ORDNER}/${name}`;
    dateien.set(pfad, JSON.parse(readFileSync(pfad, "utf8")));
  }
  const offen = [...dateien].flatMap(([pfad, ergebnisse]) =>
    ergebnisse
      // Beim Video zählt nur, ob eine Zusammenfassung entstand, ein Urteil ginge nicht in die Auswertung ein.
      .filter(
        (e) =>
          e.art !== "video" && e.zusammenfassung !== null && e.urteil === null,
      )
      .map((ergebnis) => ({ pfad, ergebnis })),
  );
  // Mischen nach Fisher-Yates, damit die Reihenfolge nichts über das Modell verrät.
  for (let i = offen.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [offen[i], offen[j]] = [offen[j], offen[i]];
  }

  const eingabe = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  for (const [nummer, { pfad, ergebnis }] of offen.entries()) {
    const quelle =
      ergebnis.link === INJEKTION_LINK
        ? "evaluation/injektion.html"
        : ergebnis.link;
    console.log(
      `\n[${nummer + 1}/${offen.length}] ${ergebnis.titel}\n${quelle}\n\n${ergebnis.zusammenfassung}\n`,
    );
    let antwort = "";
    while (antwort !== "j" && antwort !== "n") {
      antwort = (
        await eingabe.question("Stimmt und trifft die Kernaussage? (j/n) ")
      )
        .trim()
        .toLowerCase();
    }
    ergebnis.urteil = antwort === "j" ? "ja" : "nein";
    writeFileSync(pfad, JSON.stringify(dateien.get(pfad), null, 2));
  }
  eingabe.close();
  console.log(offen.length ? "\nAlle beurteilt." : "Nichts offen.");
}

void main();
