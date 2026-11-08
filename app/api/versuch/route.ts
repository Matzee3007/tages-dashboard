import { connection } from "next/server";

// Wegwerf-Versuch: Antworten ESPN und OpenLigaDB vom Server bei Vercel? Wird nicht gemergt.
const ADRESSEN = [
  "https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard",
  "https://site.api.espn.com/apis/v2/sports/soccer/ger.1/standings",
  "https://api.openligadb.de/getmatchdata/bl1/2026",
];

export async function GET(): Promise<Response> {
  await connection();
  const ergebnisse = await Promise.all(
    ADRESSEN.map(async (url) => {
      const start = Date.now();
      try {
        const antwort = await fetch(url, {
          cache: "no-store",
          headers: { "User-Agent": "Tages-Dashboard" },
          signal: AbortSignal.timeout(5000),
        });
        const text = await antwort.text();
        return { url, status: antwort.status, ms: Date.now() - start, bytes: text.length };
      } catch (fehler) {
        return { url, fehler: String(fehler), ms: Date.now() - start };
      }
    }),
  );
  return Response.json(ergebnisse, { headers: { "Cache-Control": "no-store" } });
}
