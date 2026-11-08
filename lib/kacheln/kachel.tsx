import type { ReactNode } from "react";
import type { KachelAnzeige } from "@/lib/kacheln/typen";
import { standText } from "@/lib/zeit";

export function Abschnitt({
  titel,
  children,
}: {
  titel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold tracking-[0.08em] text-gedaempft uppercase">
        {titel}
      </h3>
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
    <div
      role="status"
      className="flex flex-col gap-2.5 rounded-xl border border-dashed border-rand-stark p-3.5"
    >
      <span className="font-semibold">Daten gerade nicht erreichbar.</span>
      <span className="text-[13px] text-gedaempft">
        {stand
          ? `Letzter Stand von ${standText(stand)}, neuer Versuch in 1 Minute.`
          : "Neuer Versuch in 1 Minute."}
      </span>
      <button
        type="button"
        onClick={erneutVersuchen}
        disabled={laedt}
        className="min-h-11 cursor-pointer self-start rounded-[10px] border border-rand-stark bg-knopf px-4 text-sm disabled:cursor-default disabled:opacity-50"
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
      className="flex flex-col gap-3.5 rounded-2xl border border-rand bg-flaeche p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-titel text-[22px] font-bold tracking-[0.03em] uppercase">
          {kachel.titel}
        </h2>
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
              className="-my-2 -mr-2 grid size-11 cursor-pointer place-items-center rounded-full text-xl text-gedaempft hover:bg-knopf disabled:cursor-default"
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
