import { type CSSProperties, type ReactNode, useId, useState } from "react";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import type { Meldung } from "@/lib/kacheln/ki-news/feed";
import type { KiNewsDaten } from "@/lib/kacheln/typen";
import { alterText, istFrisch } from "@/lib/zeit";

function PunktUndTitel({ meldung, jetzt }: { meldung: Meldung; jetzt: Date }) {
  return (
    <>
      {/* Der Punkt hängt links vor dem Titel, so bleiben alle Titel bündig (Mock F). */}
      {istFrisch(meldung.zeit, jetzt, meldung.nurDatum) && (
        <span
          role="img"
          aria-label="neu"
          className="absolute top-[19px] -left-4 size-1.5 rounded-full bg-akzent"
        />
      )}
      <span className="min-w-0 flex-1 text-[15px] leading-[1.4] font-[430] decoration-rauch underline-offset-3 group-hover:underline">
        {meldung.titel}
      </span>
    </>
  );
}

function Alter({ meldung, jetzt }: { meldung: Meldung; jetzt: Date }) {
  return (
    <span className="shrink-0 text-[12.5px] whitespace-nowrap text-rauch">
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
      className="group relative flex min-h-11 items-baseline gap-4 py-3"
    >
      <PunktUndTitel meldung={meldung} jetzt={jetzt} />
      <Alter meldung={meldung} jetzt={jetzt} />
    </a>
  );
}

// Mock vom 2026-11-15, Aussehen nach Mock F vom 2026-11-16: Der Titel öffnet das Original, „Zusammenfassung“ klappt nur auf.
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
    <div>
      <a
        href={meldung.link}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex min-h-11 items-baseline gap-4 py-3"
      >
        <PunktUndTitel meldung={meldung} jetzt={jetzt} />
        <Alter meldung={meldung} jetzt={jetzt} />
      </a>
      <button
        type="button"
        aria-expanded={offen}
        aria-controls={kastenId}
        aria-label={`KI-Zusammenfassung ${offen ? "zuklappen" : "aufklappen"}`}
        onClick={() => setOffen(!offen)}
        className="-mt-3 inline-flex min-h-11 cursor-pointer items-center gap-1 text-[13px] font-semibold text-info"
      >
        Zusammenfassung
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
      </button>
      {/* Immer im DOM, damit aria-controls auch zugeklappt auf ein Element zeigt (Review von PR #61). */}
      <div
        id={kastenId}
        hidden={!offen}
        className="mb-2.5 max-w-[66ch] border-l border-info pl-3.5 text-[14.5px] leading-[1.6] text-[#c3cad5]"
      >
        <span className="block text-[12.5px] font-semibold text-info">
          KI-generiert
        </span>
        {meldung.zusammenfassung}
        <br />
        <a
          href={meldung.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-semibold text-text underline decoration-rauch underline-offset-3"
        >
          Zum Artikel ↗
        </a>
      </div>
    </div>
  );
}

// Mock F: Der Name hängt in einer eigenen Spalte links, auf schmalen Geräten steht er über den Meldungen.
const ZEILE =
  "grid border-t border-rand pt-3.5 pb-4 pl-4 @[600px]:grid-cols-[210px_minmax(0,1fr)] @[600px]:gap-x-9 @[600px]:pl-0";
const NAME =
  "-ml-4 flex items-baseline gap-[9px] text-lg leading-[1.2] font-[720] tracking-[-0.01em] @[600px]:ml-0 @[600px]:pt-2.5 @[600px]:text-[19px]";

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
