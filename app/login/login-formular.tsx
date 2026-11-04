"use client";

import { useActionState } from "react";
import { anmelden } from "./actions";

const feldStil =
  "mt-1 min-h-11 w-full rounded-[10px] border border-rand-stark bg-transparent px-3 py-2";

export function LoginFormular() {
  const [status, aktion, laeuft] = useActionState(anmelden, { fehler: null });

  return (
    <form action={aktion} className="mt-6 flex flex-col gap-4">
      <label className="block">
        E-Mail
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={feldStil}
        />
      </label>
      <label className="block">
        Passwort
        <input
          name="passwort"
          type="password"
          autoComplete="current-password"
          required
          className={feldStil}
        />
      </label>
      {status.fehler && (
        <p role="alert" className="text-red-400">
          {status.fehler}
        </p>
      )}
      <button
        type="submit"
        disabled={laeuft}
        className="min-h-11 rounded-[10px] border border-rand-stark bg-knopf px-3 py-2 disabled:opacity-50"
      >
        Anmelden
      </button>
    </form>
  );
}
