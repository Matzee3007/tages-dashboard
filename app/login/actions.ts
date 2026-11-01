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
