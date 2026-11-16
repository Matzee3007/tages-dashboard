import { LoginFormular } from "./login-formular";

export default function LoginSeite() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-8">
      <h1 className="text-[34px] leading-none font-[280] tracking-[-0.02em]">
        Anmelden
      </h1>
      <LoginFormular />
    </main>
  );
}
