import { LoginFormular } from "./login-formular";

export default function LoginSeite() {
  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-4 py-8">
      <h1 className="font-titel text-[40px] leading-none font-bold">
        Anmelden
      </h1>
      <LoginFormular />
    </main>
  );
}
