import { type CSSProperties, type ReactNode, useId, useState } from "react";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import type { Meldung } from "@/lib/kacheln/ki-news/feed";
import type { KiNewsDaten } from "@/lib/kacheln/typen";
import { alterText, istFrisch } from "@/lib/zeit";

function PunktUndTitel({ meldung, jetzt }: { meldung: Meldung; jetzt: Date }) {
  return (
    <>
      {/* Ein durchsichtiger Punkt hält die Titel bündig. */}
      {istFrisch(meldung.zeit, jetzt, meldung.nurDatum) ? (
        <span
          role="img"
          aria-label="neu"
          className="size-2 shrink-0 rounded-full bg-akzent"
        />
      ) : (
        <span aria-hidden className="size-2 shrink-0" />
      )}
      <span className="min-w-0 flex-1 text-[15px] font-medium underline-offset-3 group-hover:underline">
        {meldung.titel}
      </span>
    </>
  );
}

function Alter({ meldung, jetzt }: { meldung: Meldung; jetzt: Date }) {
  return (
    <span className="shrink-0 text-[13px] whitespace-nowrap text-gedaempft">
      {alterText(meldung.zeit, jetzt, meldung.nurDatum)}
    </span>
  );
}

function MeldungsZeile({ meldung }: { meldung: Meldung }) {
  // Ein Zeitpunkt für Punkt und Text, damit beide an der Grenze von 24 Std. zusammenpassen.
  const jetzt = new Date();
  if (meldung.zusammenfassung) {
    return <ZeileMitZusammenfassung meldung={meldung} jetzt={jetzt} />;
  }
  return (
    <a
      href={meldung.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-11 items-center gap-3 border-t border-rand py-1.5 first:border-t-0"
    >
      <PunktUndTitel meldung={meldung} jetzt={jetzt} />
      <Alter meldung={meldung} jetzt={jetzt} />
    </a>
  );
}

// Variante B aus dem Mock vom 2026-11-15: Punkt und Titel öffnen das Original, der Knopf „KI“ klappt nur auf.
// Die Zusammenfassung ist KI-generiert und reiner Text, React zeigt darin enthaltenes HTML als Zeichen (ADR 0010).
function ZeileMitZusammenfassung({
  meldung,
  jetzt,
}: {
  meldung: Meldung;
  jetzt: Date;
}) {
  const [offen, setOffen] = useState(false);
  const kastenId = useId();
  return (
    <div className="border-t border-rand first:border-t-0">
      <div className="flex min-h-11 items-center">
        <a
          href={meldung.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-h-11 min-w-0 flex-1 items-center gap-3 py-1.5"
        >
          <PunktUndTitel meldung={meldung} jetzt={jetzt} />
        </a>
        <button
          type="button"
          aria-expanded={offen}
          aria-controls={kastenId}
          aria-label={`KI-Zusammenfassung ${offen ? "zuklappen" : "aufklappen"}`}
          onClick={() => setOffen(!offen)}
          className="mr-1 grid size-11 shrink-0 cursor-pointer place-items-center text-info"
        >
          <span className="inline-flex h-6 items-center gap-0.5 rounded-[7px] bg-info/15 px-1.5 text-[11px] font-semibold tracking-[0.06em]">
            KI
            <svg
              aria-hidden
              viewBox="0 0 12 12"
              className={`size-3 transition-transform ${offen ? "rotate-180" : ""}`}
            >
              <path
                d="M3 4.5 6 7.5 9 4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
        <Alter meldung={meldung} jetzt={jetzt} />
      </div>
      {/* Immer im DOM, damit aria-controls auch zugeklappt auf ein Element zeigt (Review von PR #61). */}
      <div
        id={kastenId}
        hidden={!offen}
        className="mb-2.5 ml-5 rounded-[10px] bg-knopf px-3 py-2.5 text-sm leading-[1.42] text-gedaempft"
      >
        <span className="mb-1 block w-max rounded-[5px] bg-info/15 px-1.5 text-[11px] font-semibold tracking-[0.06em] text-info uppercase">
          KI-generiert
        </span>
        {meldung.zusammenfassung}
        <br />
        <a
          href={meldung.link}
          target="_blank"
          rel="noopener noreferrer"
          className="-mb-2.5 mt-0.5 inline-flex min-h-11 items-center text-[13px] font-medium text-text hover:underline"
        >
          Zum Artikel ↗
        </a>
      </div>
    </div>
  );
}

// Mock F: Der Name hängt in einer eigenen Spalte links, auf schmalen Geräten steht er über den Meldungen.
const ZEILE =
  "grid border-t border-rand pt-3.5 pb-4 @[600px]:grid-cols-[210px_minmax(0,1fr)] @[600px]:gap-x-9";
const NAME =
  "flex items-baseline gap-[9px] text-lg leading-[1.2] font-[720] tracking-[-0.01em] @[600px]:pt-2.5 @[600px]:text-[19px]";

function farben(absender: AbsenderStand): CSSProperties {
  return {
    "--farbe": absender.aussehen.farbe,
    "--marke": absender.aussehen.marke ?? absender.aussehen.farbe,
  } as CSSProperties;
}

function AbsenderAbschnitt({
  absender,
  children,
}: {
  absender: AbsenderStand;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={absender.name}
      style={farben(absender)}
      className={ZEILE}
    >
      <h3 className={`${NAME} text-(--farbe)`}>
        <span
          aria-hidden
          className="size-[9px] shrink-0 -translate-y-px rounded-[2px] bg-(--marke)"
        />
        {absender.name}
      </h3>
      <div className="flex max-w-[760px] min-w-0 flex-col">{children}</div>
    </section>
  );
}

function RuhigeZeile({ absender }: { absender: AbsenderStand }) {
  return (
    <div className={`${ZEILE} text-sm text-gedaempft`}>
      <span className={NAME}>{absender.name}</span>
      <span className="pt-1 @[600px]:pt-3">
        {!absender.erreichbar ? (
          <span className="text-fehler">nicht erreichbar</span>
        ) : absender.letzteMeldung ? (
          <span>{`zuletzt ${alterText(absender.letzteMeldung)}`}</span>
        ) : (
          <span>noch keine Meldung</span>
        )}
      </span>
    </div>
  );
}

export function KiNewsAnsicht({ daten }: { daten: KiNewsDaten }) {
  const aktiv = daten.absender.filter((a) => a.meldungen.length > 0);
  const ruhig = daten.absender.filter((a) => a.meldungen.length === 0);

  return (
    <div className="@container flex flex-col">
      {aktiv.map((absender) => (
        <AbsenderAbschnitt key={absender.name} absender={absender}>
          {absender.meldungen.map((meldung) => (
            <MeldungsZeile key={meldung.link} meldung={meldung} />
          ))}
        </AbsenderAbschnitt>
      ))}
      {ruhig.map((absender) => (
        <RuhigeZeile key={absender.name} absender={absender} />
      ))}
    </div>
  );
}
