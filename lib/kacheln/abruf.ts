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
    // Ohne Sitzung leitet der Proxy zum Login, fetch folgt ihm und bekommt die Seite als HTML.
    if (antwort.redirected) return "abgemeldet";
    if (!antwort.ok) return null;
    return (await antwort.json()) as DashboardAntwort;
  } catch {
    return null;
  }
}
