import { connection } from "next/server";
import { ladeDashboard } from "@/lib/kacheln/laden";

export async function GET(): Promise<Response> {
  // Mit cacheComponents entstünde die Antwort sonst schon beim Bauen, und die Uhrzeit bliebe stehen.
  await connection();
  return Response.json(await ladeDashboard(), {
    headers: { "Cache-Control": "no-store" },
  });
}
