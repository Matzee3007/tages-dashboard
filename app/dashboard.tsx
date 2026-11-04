"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { abmelden } from "@/app/login/actions";
import { holeDashboard } from "@/lib/kacheln/abruf";
import { FehlerHinweis, Kachel } from "@/lib/kacheln/kachel";
import { neuerStand } from "@/lib/kacheln/stand";
import { TestAnsicht } from "@/lib/kacheln/test/ansicht";
import type { KachelAnzeige, KachelDaten } from "@/lib/kacheln/typen";
import { useAktualisierung } from "@/lib/kacheln/use-aktualisierung";
import { datum, uhrzeit } from "@/lib/zeit";

function KachelInhalt({ daten }: { daten: KachelDaten }) {
  switch (daten.art) {
    case "test":
      return <TestAnsicht daten={daten} />;
  }
}

export function Dashboard() {
  const [kacheln, setKacheln] = useState<KachelAnzeige[]>([]);
  const [zeit, setZeit] = useState<string | null>(null);
  const [geladen, setGeladen] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const laeuft = useRef(false);
  const router = useRouter();

  const abrufen = useCallback(async () => {
    if (laeuft.current) return;
    laeuft.current = true;
    setLaedt(true);
    const antwort = await holeDashboard();
    laeuft.current = false;
    setLaedt(false);

    if (antwort === "abgemeldet") {
      router.replace("/login");
      return;
    }
    setKacheln((bisher) => neuerStand(bisher, antwort));
    // Scheitern alle Kacheln, gab es nichts Neues, und der Kopf soll das nicht behaupten.
    if (antwort?.kacheln.some((kachel) => kachel.status === "ok")) {
      setZeit(antwort.zeit);
    }
    setGeladen(true);
  }, [router]);

  useAktualisierung(abrufen);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-5 px-4 pt-6 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-gedaempft uppercase">
            Tages-Dashboard
          </span>
          <h1 className="font-titel text-[40px] leading-none font-bold tracking-[0.01em]">
            {zeit ? datum(zeit) : "Heute"}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {zeit && (
            <span className="flex items-center gap-2 text-[13px] text-gedaempft">
              <span className="size-2 rounded-full bg-info" />
              <span>Aktualisiert {uhrzeit(zeit)}</span>
            </span>
          )}
          <form action={abmelden}>
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-[10px] border border-rand-stark px-4 text-sm"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-col gap-4">
        {!geladen && <p className="text-gedaempft">Lädt …</p>}
        {geladen && kacheln.length === 0 && (
          <FehlerHinweis stand={null} erneutVersuchen={abrufen} laedt={laedt} />
        )}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] items-start gap-4">
          {kacheln.map((kachel) => (
            <Kachel
              key={kachel.id}
              kachel={kachel}
              erneutVersuchen={abrufen}
              laedt={laedt}
            >
              {kachel.daten && <KachelInhalt daten={kachel.daten} />}
            </Kachel>
          ))}
        </div>
      </main>
    </div>
  );
}
