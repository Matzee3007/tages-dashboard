"use server";

import { redirect } from "next/navigation";
import { erstelleClient } from "@/lib/supabase/server";

export type AnmeldeStatus = { fehler: string | null };

export async function anmelden(
  _status: AnmeldeStatus,
  formular: FormData,
): Promise<AnmeldeStatus> {
  const email = String(formular.get("email") ?? "");
  const password = String(formular.get("passwort") ?? "");
  if (!email || !password) {
    return { fehler: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await erstelleClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return {
      fehler:
        error.code === "invalid_credentials"
          ? "E-Mail oder Passwort stimmt nicht."
          : "Anmeldung gerade nicht möglich.",
    };
  }

  redirect("/");
}

export async function abmelden(): Promise<void> {
  const supabase = await erstelleClient();
  const { error } = await supabase.auth.signOut();
  // Seit supabase-js 2.119 bleibt das Cookie, wenn der Server scheitert. Dann wenigstens auf dem Gerät abmelden.
  // Das Refresh-Token bleibt beim Server gültig, bis ein späteres Abmelden gelingt (docs/tools/Supabase.md).
  if (error) {
    console.error("Abmelden beim Server gescheitert:", error);
    const lokal = await supabase.auth.signOut({ scope: "local" });
    if (lokal.error) {
      console.error("Auch lokales Abmelden gescheitert:", lokal.error);
    }
  }
  redirect("/login");
}
