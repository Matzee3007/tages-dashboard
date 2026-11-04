import type { DashboardAntwort } from "@/lib/kacheln/typen";

// Nicht router.refresh(): Next.js lädt dabei bei Netzfehler oder Status 500 die ganze Seite neu (ADR 0004).
export async function holeDashboard(): Promise<
  DashboardAntwort | "abgemeldet" | null
> {
  try {
    const antwort = await fetch("/api/kacheln", {
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    // Nur 401 heißt abgemeldet. 503 meldet der Proxy bei einem kurzen Ausfall von Supabase.
    if (antwort.status === 401) return "abgemeldet";
    if (!antwort.ok) return null;
    const daten = (await antwort.json()) as DashboardAntwort;
    // Eine lange offene App kann nach einem Deploy auf eine neue Form der Antwort treffen.
    return Array.isArray(daten?.kacheln) ? daten : null;
  } catch {
    return null;
  }
}
