import { leseFeed, type Meldung } from "@/lib/kacheln/ki-news/feed";

const ZWISCHENSPEICHER_SEKUNDEN = 900;
const KANAL_ZEITLIMIT_MS = 5000;

export async function ladeKanal(url: string): Promise<Meldung[]> {
  const antwort = await fetch(url, {
    headers: { "User-Agent": "Tages-Dashboard" },
    next: { revalidate: ZWISCHENSPEICHER_SEKUNDEN },
    signal: AbortSignal.timeout(KANAL_ZEITLIMIT_MS),
  });
  if (!antwort.ok) {
    throw new Error(`Status ${antwort.status}`);
  }
  return leseFeed(await antwort.text());
}
