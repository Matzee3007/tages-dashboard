"use client";

import { useActionState } from "react";
import { anmelden } from "./actions";

const feldStil =
  "mt-1 w-full rounded border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

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
        <p role="alert" className="text-red-600 dark:text-red-400">
          {status.fehler}
        </p>
      )}
      <button
        type="submit"
        disabled={laeuft}
        className="rounded bg-zinc-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Anmelden
      </button>
    </form>
  );
}
