import { abmelden } from "@/app/login/actions";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Tages-Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Sport, Schritte und KI-News auf einen Blick. Die Kacheln kommen ab Phase
        1.
      </p>
      <form action={abmelden} className="mt-6">
        <button type="submit" className="underline">
          Abmelden
        </button>
      </form>
    </main>
  );
}
