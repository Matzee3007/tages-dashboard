// Druckt die Ergebnisse der Evaluation als Markdown-Tabelle, eine Zeile je Modell (Plan 2026-11-15-evaluation).
// Aufruf: npx tsx evaluation/auswertung.ts
import { readdirSync, readFileSync } from "node:fs";
import { type Ergebnis, werteAus } from "@/evaluation/bewertung";

const ORDNER = "evaluation/daten";

const auswertungen = readdirSync(ORDNER)
  .filter((name) => name.startsWith("ergebnis-") && name.endsWith(".json"))
  .map((name) =>
    werteAus(
      JSON.parse(readFileSync(`${ORDNER}/${name}`, "utf8")) as Ergebnis[],
    ),
  );

console.log(
  "| Modell | Treffer | Format | 2–3 Sätze | Deutsch | ohne Anweisung | Median s | Max s |",
);
console.log("|---|---|---|---|---|---|---|---|");
for (const a of auswertungen) {
  const mitText = a.von - 1; // ohne das Video
  console.log(
    `| ${a.modell} | ${a.treffer}/${a.von} | ${a.format}/${mitText} | ${a.saetze}/${mitText} | ${a.deutsch}/${mitText} | ${a.ohneAnweisung}/${mitText} | ${a.sekundenMedian.toFixed(1)} | ${a.sekundenMax} |`,
  );
}
for (const a of auswertungen) {
  if (a.offen > 0) {
    console.log(`\nWarnung: ${a.modell} hat ${a.offen} offene Urteile.`);
  }
}
