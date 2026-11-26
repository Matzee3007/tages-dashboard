"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { abmelden } from "@/app/login/actions";
import { holeDashboard } from "@/lib/kacheln/abruf";
import { FussballAnsicht } from "@/lib/kacheln/fussball/ansicht";
import { Heute } from "@/lib/kacheln/heute";
import { gruppiere } from "@/lib/kacheln/gruppen";
import { FehlerHinweis, Kachel } from "@/lib/kacheln/kachel";
import { KiNewsAnsicht } from "@/lib/kacheln/ki-news/ansicht";
import { NflAnsicht } from "@/lib/kacheln/nfl/ansicht";
import { Formel1Ansicht } from "@/lib/kacheln/formel-1/ansicht";
import { HEUTE, reiterListe, reiterVon } from "@/lib/kacheln/reiter";
import { ReiterLeiste } from "@/lib/kacheln/reiter-leiste";
import { neuerStand } from "@/lib/kacheln/stand";
import { abzeichen, uebersicht } from "@/lib/kacheln/uebersicht";
import type { KachelAnzeige, KachelDaten } from "@/lib/kacheln/typen";
import { useAktualisierung } from "@/lib/kacheln/use-aktualisierung";
import { datum, uhrzeit } from "@/lib/zeit";

// „Sonntag, 22. November“ → Wochentag klein darüber, Datum groß (Mock G). Den ganzen Namen trägt die Überschrift als aria-label.
function Datum({ zeit }: { zeit: string | null }) {
  if (!zeit) return <>Heute</>;
  const [wochentag, rest] = datum(zeit).split(", ");
  return (
    <>
      <span className="block text-[15px] font-semibold tracking-normal text-gedaempft">
        {wochentag}
      </span>
      {rest}
    </>
  );
}

// ebene: die der Abschnitte, eine unter dem Kacheltitel.
function KachelInhalt({ daten, ebene }: { daten: KachelDaten; ebene: 3 | 4 }) {
  switch (daten.art) {
    case "ki-news":
      return <KiNewsAnsicht daten={daten} />;
    case "fussball":
      return <FussballAnsicht daten={daten} ebene={ebene} />;
    case "nfl":
      return <NflAnsicht daten={daten} ebene={ebene} />;
    case "formel-1":
      return <Formel1Ansicht daten={daten} ebene={ebene} />;
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
  // Beim Öffnen steht die Übersicht vorn, ein Reiter ist keine eigene Route (ADR 0014).
  const [aktiv, setAktiv] = useState(HEUTE);
  // Ein Tipp in „Heute“ führt zur Kachel: Der Reiter wechselt, nach dem Rendern scrollt die Seite zu ihr.
  const [ziel, setZiel] = useState<{ kachelId?: string }>({});
  const waehle = useCallback((reiter: string, kachelId?: string) => {
    setAktiv(reiter);
    setZiel({ kachelId });
  }, []);
  useEffect(() => {
    if (ziel.kachelId) document.getElementById(ziel.kachelId)?.scrollIntoView();
    else document.documentElement.scrollTop = 0;
  }, [ziel]);
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

  // Bei jedem Rendern neu: Die Kurzfassungen sind billig, und „Neu“ hängt an der Uhrzeit. Die Uhr erst nach dem ersten
  // Laden lesen: Beim Vorab-Rendern im Build ist `new Date()` verboten, und ohne Kacheln gibt es nichts zusammenzufassen.
  const jetzt = geladen ? new Date() : new Date(0);
  const stand = uebersicht(kacheln, jetzt);

  return (
    <div className="mx-auto flex w-full max-w-[1320px] flex-1 flex-col gap-9 px-3.5 pt-[22px] pb-[calc(6rem+env(safe-area-inset-bottom))] min-[600px]:gap-11 min-[600px]:px-7 min-[600px]:pt-[30px] min-[600px]:pb-12">
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2.5">
        <h1
          aria-label={zeit ? datum(zeit) : "Heute"}
          className="text-[30px] leading-[1.05] font-[780] tracking-[-0.025em] min-[600px]:text-[34px]"
        >
          <Datum zeit={zeit} />
        </h1>
        <div className="flex items-center gap-3 text-[13.5px] text-gedaempft">
          {zeit && <span>Aktualisiert {uhrzeit(zeit)}</span>}
          <form action={abmelden}>
            <button
              type="submit"
              className="min-h-11 cursor-pointer rounded-full bg-karte px-[18px] font-semibold text-text hover:bg-knopf"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <ReiterLeiste
        reiter={reiterListe(kacheln)}
        aktiv={aktiv}
        waehle={waehle}
        abzeichen={abzeichen(stand)}
      />

      <main className="flex flex-col gap-9 min-[600px]:gap-11">
        {!geladen && <p className="text-gedaempft">Lädt …</p>}
        {geladen && kacheln.length === 0 && (
          <FehlerHinweis
            stand={null}
            erneutVersuchen={erneutVersuchen}
            laedt={laedt}
          />
        )}
        {geladen && kacheln.length > 0 && aktiv === HEUTE && (
          <Heute uebersicht={stand} jetzt={jetzt} waehle={waehle} />
        )}
        {gruppiere(kacheln.filter((kachel) => reiterVon(kachel) === aktiv)).map(
          ({ gruppe, kacheln: imBlock }) => {
            const liste = imBlock.map((kachel) => (
              <Kachel
                key={kachel.id}
                kachel={kachel}
                erneutVersuchen={erneutVersuchen}
                aktualisieren={() => abrufen(kachel.id)}
                laedt={laedt}
                holtFrisch={frischId === kachel.id}
              >
                {kachel.daten && (
                  <KachelInhalt
                    daten={kachel.daten}
                    ebene={kachel.gruppe ? 4 : 3}
                  />
                )}
              </Kachel>
            ));
            if (gruppe === null) return liste;
            return (
              <section
                key={`gruppe-${imBlock[0].id}`}
                aria-label={gruppe}
                className="@container flex flex-col gap-3.5"
              >
                <div className="grid items-start gap-4 @[900px]:grid-cols-3">
                  {liste}
                </div>
              </section>
            );
          },
        )}
      </main>
    </div>
  );
}
