import type { CSSProperties, ReactNode } from "react";
import type { Aussehen } from "@/lib/einstellungen";
import type { KachelAnzeige } from "@/lib/kacheln/typen";
import { standText } from "@/lib/zeit";

// Farbe nur als Akzent: Quadrat (--marke), Grenzlinie und Name des Absenders (--farbe), Mock F.
export function farbVariablen(aussehen: Aussehen): CSSProperties {
  return {
    "--farbe": aussehen.farbe,
    "--marke": aussehen.marke ?? aussehen.farbe,
  } as CSSProperties;
}

// ebene: eine unter dem Kacheltitel (h3 ohne Gruppe, h4 in einer Gruppe).
export function Abschnitt({
  titel,
  ebene = 4,
  children,
}: {
  titel: string;
  ebene?: 3 | 4;
  children: ReactNode;
}) {
  const Ueberschrift = ebene === 3 ? "h3" : "h4";
  return (
    <div className="flex flex-col gap-1">
      <Ueberschrift className="text-[13px] font-semibold text-gedaempft">
        {titel}
      </Ueberschrift>
      {children}
    </div>
  );
}

export function FehlerHinweis({
  stand,
  erneutVersuchen,
  laedt = false,
}: {
  stand: string | null;
  erneutVersuchen: () => void;
  laedt?: boolean;
}) {
  return (
    <div role="status" className="flex flex-col items-start text-sm">
      <span className="font-semibold text-fehler">
        Daten gerade nicht erreichbar.
      </span>
      <span className="text-gedaempft">
        {stand
          ? `Letzter Stand von ${standText(stand)}, neuer Versuch in 1 Minute.`
          : "Neuer Versuch in 1 Minute."}
      </span>
      <button
        type="button"
        onClick={erneutVersuchen}
        disabled={laedt}
        className="-ml-3.5 min-h-11 cursor-pointer rounded-lg px-3.5 font-semibold text-info hover:bg-knopf disabled:cursor-default disabled:opacity-50"
      >
        {laedt ? "Wird versucht …" : "Jetzt erneut versuchen"}
      </button>
    </div>
  );
}

export function Kachel({
  kachel,
  erneutVersuchen,
  aktualisieren,
  laedt = false,
  holtFrisch = false,
  children,
}: {
  kachel: KachelAnzeige;
  erneutVersuchen: () => void;
  aktualisieren?: () => void;
  laedt?: boolean;
  // Nur dann dreht sich ↻: Der Minutentakt soll nicht nach frischem Holen aussehen.
  holtFrisch?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      aria-label={kachel.titel}
      style={farbVariablen(kachel.aussehen)}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="-mr-3 flex min-h-11 items-center gap-2.5">
        {/* In einer Gruppe ist die Kachel eine von mehreren unter deren Überschrift, sonst trägt sie selbst den großen Titel. */}
        {kachel.gruppe ? (
          <>
            <span
              aria-hidden
              className="size-[9px] shrink-0 rounded-[2px] bg-(--marke)"
            />
            <h3 className="flex-1 text-base font-[720] tracking-[-0.005em]">
              {kachel.titel}
            </h3>
          </>
        ) : (
          <h2 className="flex-1 text-[30px] leading-none font-[280] tracking-[-0.02em] min-[600px]:text-[34px]">
            {kachel.titel}
          </h2>
        )}
        <div className="flex items-center gap-1">
          {kachel.zusatz && (
            <span className="text-[13px] text-gedaempft">{kachel.zusatz}</span>
          )}
          {aktualisieren && (
            <button
              type="button"
              onClick={aktualisieren}
              disabled={laedt}
              aria-label={`${kachel.titel} aktualisieren`}
              title="Frisch von den Quellen holen"
              className="grid size-11 cursor-pointer place-items-center rounded-lg text-lg text-rauch hover:bg-knopf hover:text-text disabled:cursor-default"
            >
              <span
                aria-hidden
                className={holtFrisch ? "animate-spin" : undefined}
              >
                ↻
              </span>
            </button>
          )}
        </div>
      </div>
      {kachel.fehler && (
        <FehlerHinweis
          stand={kachel.stand}
          erneutVersuchen={erneutVersuchen}
          laedt={laedt}
        />
      )}
      {children}
    </section>
  );
}
