import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { BESITZER_ID } from "@/lib/besitzer";
import { SUPABASE_COOKIE_OPTIONEN } from "@/lib/supabase/cookies";

// Läuft vor jeder Anfrage: prüft und erneuert die Sitzung und schickt ohne Sitzung zum Login.
export async function proxy(request: NextRequest) {
  let antwort = NextResponse.next({ request });
  let cacheHeader: Record<string, string> = {};

  // Fehlen die Variablen, wirft createServerClient: lieber Fehler 500 als eine offene Seite.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SUPABASE_COOKIE_OPTIONEN,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // Erst für die Seiten dieser Anfrage, dann für den Browser
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          antwort = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            antwort.cookies.set(name, value, options),
          );
          cacheHeader = headers;
          Object.entries(headers).forEach(([name, wert]) =>
            antwort.headers.set(name, wert),
          );
        },
      },
    },
  );

  // Kein Code zwischen createServerClient und getClaims: sonst drohen zufällige Abmeldungen (Doku von Supabase).
  const { data } = await supabase.auth.getClaims();
  // Nur das eine Konto zählt: Ein gültiges fremdes Konto (Schalter bei Supabase falsch) kommt nicht hinein.
  const angemeldet = data?.claims?.sub === BESITZER_ID;
  const aufLogin = request.nextUrl.pathname === "/login";

  if (angemeldet === aufLogin) {
    const ziel = request.nextUrl.clone();
    ziel.pathname = angemeldet ? "/" : "/login";
    const weiterleitung = NextResponse.redirect(ziel);
    // Erneuerte Cookies müssen auch auf der Weiterleitung landen, sonst fliegt man später heraus.
    antwort.cookies
      .getAll()
      .forEach((cookie) => weiterleitung.cookies.set(cookie));
    Object.entries(cacheHeader).forEach(([name, wert]) =>
      weiterleitung.headers.set(name, wert),
    );
    return weiterleitung;
  }

  return antwort;
}

export const config = {
  // Nur Statisches auslassen, damit jede neue Seite und Schnittstelle von selbst geschützt ist.
  matcher: ["/((?!_next/static/|_next/image(?:/|$)|favicon\\.ico$).*)"],
};
