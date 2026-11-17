// Das Modell schreibt Spielberichte zum Testsatz, der Entwickler urteilt danach in der Ergebnisdatei
// (Plan 2026-11-17-spielberichte, Aufgabe 4). Vorher: Container gestoppt, Kontextfenster 8192.
// Aufruf: npx tsx evaluation/spielberichte/lauf.ts <modellname>
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import {
  type TestPartie,
  TESTSATZ_SPIELBERICHTE,
} from "@/evaluation/spielberichte/testsatz";
import { KACHELN } from "@/lib/einstellungen";
import { holeJson } from "@/lib/kacheln/fussball/abruf";
import { espnAdresse, leseTag } from "@/lib/kacheln/fussball/espn";
import { ladeLiveticker } from "@/lib/spielbericht/liveticker";
import {
  ANWEISUNG_SPIELBERICHT,
  SCHEMA_SPIELBERICHT,
  anfrageInhalt,
} from "@/lib/spielbericht/modell";
import { pruefeMitGrund } from "@/lib/spielbericht/pruefung";
import { frageModell, type Modell } from "@/lib/zusammenfassen/modell";

const MODELL_URL = "http://localhost:12434/engines/v1/";
const DATEI = "evaluation/daten/spielberichte.md";

function teams(liga: string) {
  const kachel = KACHELN.find(
    (einstellung) =>
      einstellung.art === "fussball" && einstellung.espn === liga,
  );
  return kachel?.art === "fussball" ? kachel.teams : [];
}

function frage(modell: Modell, inhalt: string) {
  return frageModell(modell, {
    anweisung: ANWEISUNG_SPIELBERICHT,
    inhalt,
    schemaName: "spielbericht",
    schema: SCHEMA_SPIELBERICHT,
  });
}

// Ein Abschnitt je Partie, gleich in die Datei: Ein Abbruch nimmt die bisherigen Antworten nicht mit.
async function einePartie(
  modell: Modell,
  test: TestPartie,
  jetzt: Date,
): Promise<string> {
  const tag = await holeJson(
    `${espnAdresse("scoreboard", test.liga)}?dates=${test.tag}`,
    "frisch",
    jetzt,
  );
  const partie = leseTag(tag, jetzt, teams(test.liga)).find(
    (kandidat) => kandidat.id === test.partie,
  );
  const liveticker = await ladeLiveticker(test.liga, test.partie, jetzt);
  if (!partie || !liveticker) return "Partie oder Liveticker fehlt.";

  const start = performance.now();
  const roh = await frage(modell, anfrageInhalt(partie, liveticker));
  const sekunden = Math.round((performance.now() - start) / 100) / 10;
  const ergebnis = roh === null ? null : pruefeMitGrund(roh, partie);
  const pruefung =
    ergebnis === null
      ? "keine Antwort"
      : "bericht" in ergebnis
        ? "angenommen"
        : ergebnis.grund;
  const titel = `${partie.heim.name} – ${partie.gast.name} ${partie.heim.tore}:${partie.gast.tore}`;
  console.log(`${titel} | ${sekunden} s | ${pruefung}`);
  return [
    `**${titel}**`,
    "",
    `- Tore: ${partie.tore.map((tor) => tor.text).join(", ") || "keine"}`,
    `- Sekunden: ${sekunden}`,
    `- Prüfung: ${pruefung}`,
    "",
    "```json",
    roh ?? "",
    "```",
    "",
    "Urteil: ",
  ].join("\n");
}

async function main(name: string | undefined): Promise<void> {
  if (!name)
    throw new Error(
      "Aufruf: npx tsx evaluation/spielberichte/lauf.ts <modellname>",
    );
  // Nie still überschreiben, was der Entwickler schon beurteilt hat.
  if (existsSync(DATEI))
    throw new Error(
      `${DATEI} gibt es schon. Erst sichern oder löschen, dann neu starten.`,
    );
  const modell = { url: MODELL_URL, name };
  const jetzt = new Date();

  // Der erste Aufruf lädt das Modell in den Speicher und zählt deshalb nicht.
  await frage(modell, "Aufwärmen");

  writeFileSync(DATEI, `# Evaluation Spielberichte: ${name}\n\n`);
  for (const test of TESTSATZ_SPIELBERICHTE) {
    let abschnitt: string;
    try {
      abschnitt = await einePartie(modell, test, jetzt);
    } catch (fehler) {
      console.error(`${test.partie}: ${fehler}`);
      abschnitt = `Fehler: ${fehler}`;
    }
    appendFileSync(
      DATEI,
      `## ${test.partie}, ${test.liga} (${test.art})\n\n${abschnitt}\n\n`,
    );
  }
  console.log(`Geschrieben: ${DATEI}`);
}

void main(process.argv[2]);
