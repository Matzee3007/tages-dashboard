// Einstieg im Container (compose.yaml): alle 15 Minuten anmelden, Zusammenfassungen und Spielberichte erzeugen, abmelden
// (ADR 0010, ADR 0013).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { durchlaufSpielberichte } from "@/lib/spielbericht/durchlauf";
import { durchlauf } from "@/lib/zusammenfassen/durchlauf";

const TAKT_MS = 15 * 60 * 1000;
const SUPABASE_ZEITLIMIT_MS = 10000;
const PASSWORT_DATEI = "/run/secrets/supabase_passwort";

function umgebung(name: string): string {
  const wert = process.env[name];
  if (!wert) throw new Error(`Umgebungsvariable ${name} fehlt`);
  return wert;
}

const modell = { url: umgebung("MODELL_URL"), name: umgebung("MODELL_NAME") };

async function einmal(): Promise<void> {
  // Bei jedem Lauf frisch anmelden: Die Sitzung lebt nur im Speicher, nichts muss erneuert werden.
  const client = createClient(
    umgebung("NEXT_PUBLIC_SUPABASE_URL"),
    umgebung("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, optionen) =>
          fetch(url, {
            ...optionen,
            signal: AbortSignal.timeout(SUPABASE_ZEITLIMIT_MS),
          }),
      },
    },
  );
  const { error } = await client.auth.signInWithPassword({
    email: umgebung("ZUSAMMENFASSEN_EMAIL"),
    password: readFileSync(PASSWORT_DATEI, "utf8").trim(),
  });
  if (error) throw error;
  try {
    // Jeder Teil darf scheitern, ohne den anderen zu stoppen.
    try {
      const { neu, ohne } = await durchlauf(client, modell, new Date());
      console.log(`Durchlauf: neu ${neu}, ohne ${ohne}`);
    } catch (fehler) {
      console.error("Zusammenfassungen abgebrochen:", fehler);
    }
    try {
      const { neu, ohne } = await durchlaufSpielberichte(
        client,
        modell,
        new Date(),
      );
      console.log(`Spielberichte: neu ${neu}, ohne ${ohne}`);
    } catch (fehler) {
      console.error("Spielberichte abgebrochen:", fehler);
    }
  } finally {
    await client.auth.signOut({ scope: "local" });
  }
}

// Ein Fehler betrifft nur diesen Lauf. Der Container läuft weiter, der nächste Versuch kommt in 15 Minuten.
// Eine Funktion statt await auf oberster Ebene: tsx übersetzt die Datei als CommonJS, dort gibt es das nicht.
async function schleife(): Promise<never> {
  for (;;) {
    try {
      await einmal();
    } catch (fehler) {
      console.error("Durchlauf abgebrochen:", fehler);
    }
    await new Promise((weiter) => setTimeout(weiter, TAKT_MS));
  }
}

void schleife();
