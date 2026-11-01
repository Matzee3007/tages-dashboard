import { LoginFormular } from "./login-formular";

export default function LoginSeite() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Anmelden</h1>
      <LoginFormular />
    </main>
  );
}
