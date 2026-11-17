// Aufruf des lokalen Modells über Docker Model Runner, gemeinsam für Zusammenfassungen und Spielberichte (ADR 0010, ADR 0013).

const MODELL_ZEITLIMIT_MS = 120000;

// Ein fremder Text darf seine Grenze (z. B. </artikel>) nicht selbst schließen und dahinter Anweisungen unterbringen
// (indirekte Prompt Injection, Review von PR #61).
export function ohneGrenzen(text: string, grenze: string): string {
  return text.replace(new RegExp(`<\\s*\\/?\\s*${grenze}\\s*>`, "gi"), " ");
}

export type Modell = { url: string; name: string };

export type Anfrage = {
  anweisung: string;
  inhalt: string;
  schemaName: string;
  schema: object;
};

// url und name setzt Docker Compose (MODELL_URL, MODELL_NAME), z. B. http://model-runner.docker.internal/v1/.
// Liefert den Inhalt der Antwort ungeprüft. Ein Fehler des Modells ergibt null, ist es gar nicht erreichbar, wirft fetch weiter.
export async function frageModell(
  modell: Modell,
  anfrage: Anfrage,
): Promise<string | null> {
  const antwort = await fetch(
    `${modell.url.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(MODELL_ZEITLIMIT_MS),
      body: JSON.stringify({
        model: modell.name,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: anfrage.schemaName,
            strict: true,
            schema: anfrage.schema,
          },
        },
        messages: [
          { role: "system", content: anfrage.anweisung },
          { role: "user", content: anfrage.inhalt },
        ],
      }),
    },
  );
  if (!antwort.ok) {
    console.error(`Modell: Status ${antwort.status}`, await antwort.text());
    return null;
  }
  const daten = await antwort.json();
  // Auch mit Status 200 kann der Inhalt fehlen, z. B. bei einem Fehler im Kontextfenster.
  const inhalt = daten?.choices?.[0]?.message?.content;
  return typeof inhalt === "string" ? inhalt : null;
}
