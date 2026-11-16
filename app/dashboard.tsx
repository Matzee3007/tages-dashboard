"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { abmelden } from "@/app/login/actions";
import { holeDashboard } from "@/lib/kacheln/abruf";
import { FussballAnsicht } from "@/lib/kacheln/fussball/ansicht";
import { FehlerHinweis, Kachel } from "@/lib/kacheln/kachel";
import { KiNewsAnsicht } from "@/lib/kacheln/ki-news/ansicht";
import { neuerStand } from "@/lib/kacheln/stand";
import type { KachelAnzeige, KachelDaten } from "@/lib/kacheln/typen";
import { useAktualisierung } from "@/lib/kacheln/use-aktualisierung";
import { datum, uhrzeit } from "@/lib/zeit";

function KachelInhalt({ daten }: { daten: KachelDaten }) {
  switch (daten.art) {
    case "ki-news":
      return <KiNewsAnsicht daten={daten} />;
    case "fussball":
      return <FussballAnsicht daten={daten} />;
    // Eine seit dem letzten Deploy offene Seite kennt eine neue Kachel-Art noch nicht.
    default:
      return (
        <p className="text-gedaempft">
          Neue Kachel, bitte die Seite neu laden.
        </p>
      );
  }
}

export function Dashboard() {
  const [kacheln, setKacheln] = useState<KachelAnzeige[]>([]);
  const [zeit, setZeit] = useState<string | null>(null);
  const [geladen, setGeladen] = useState(false);
  const [laedt, setLaedt] = useState(false);
  const [frischId, setFrischId] = useState<string | null>(null);
  const laeuft = useRef(false);
  const router = useRouter();

  const abrufen = useCallback(
    async (frisch?: string) => {
      if (laeuft.current) return;
      laeuft.current = true;
      setLaedt(true);
      setFrischId(frisch ?? null);
      const antwort = await holeDashboard(frisch);
      laeuft.current = false;
      setLaedt(false);
      setFrischId(null);

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
    },
    [router],
  );
  // Ohne Argument: Ein Knopf gäbe sonst sein Klick-Ereignis als frisch weiter.
  const erneutVersuchen = useCallback(() => abrufen(), [abrufen]);

  useAktualisierung(erneutVersuchen);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-10 px-[18px] pt-[22px] pb-9 min-[600px]:gap-[52px] min-[600px]:px-9 min-[600px]:pt-[30px] min-[600px]:pb-12">
      <header className="flex items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-x-3 min-[600px]:flex-row min-[600px]:items-baseline">
          <h1 className="text-[17px] font-[650] tracking-[-0.005em]">
            {zeit ? datum(zeit) : "Heute"}
          </h1>
          {zeit && (
            <span className="text-[17px] text-gedaempft">
              Aktualisiert {uhrzeit(zeit)}
            </span>
          )}
        </div>
        <form action={abmelden}>
          <button
            type="submit"
            className="min-h-11 cursor-pointer rounded-lg px-3.5 font-medium text-gedaempft hover:bg-knopf hover:text-text"
          >
            Abmelden
          </button>
        </form>
      </header>

      <main className="flex flex-col gap-4">
        {!geladen && <p className="text-gedaempft">Lädt …</p>}
        {geladen && kacheln.length === 0 && (
          <FehlerHinweis
            stand={null}
            erneutVersuchen={erneutVersuchen}
            laedt={laedt}
          />
        )}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] items-start gap-4">
          {kacheln.map((kachel) => (
            <Kachel
              key={kachel.id}
              kachel={kachel}
              erneutVersuchen={erneutVersuchen}
              aktualisieren={() => abrufen(kachel.id)}
              laedt={laedt}
              holtFrisch={frischId === kachel.id}
            >
              {kachel.daten && <KachelInhalt daten={kachel.daten} />}
            </Kachel>
          ))}
        </div>
      </main>
    </div>
  );
}
