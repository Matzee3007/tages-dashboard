import { revalidateTag } from "next/cache";
import { connection } from "next/server";
import { KACHELN } from "@/lib/einstellungen";
import { ladeDashboard } from "@/lib/kacheln/laden";

async function antwortMitKacheln(): Promise<Response> {
  return Response.json(await ladeDashboard(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(): Promise<Response> {
  // Mit cacheComponents entstünde die Antwort sonst schon beim Bauen, und die Uhrzeit bliebe stehen.
  await connection();
  return antwortMitKacheln();
}

// Knopf ↻ einer Kachel: Ihr Speicher gilt sofort als abgelaufen, die Abrufe dieser Anfrage gehen an die Quellen (ADR 0008).
export async function POST(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("frisch");
  const kachel = KACHELN.find((einstellung) => einstellung.id === id);
  if (!kachel) {
    return new Response(null, { status: 400 });
  }
  revalidateTag(kachel.id, { expire: 0 });
  return antwortMitKacheln();
}
