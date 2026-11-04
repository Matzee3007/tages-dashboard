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
  laedt = false,
  children,
}: {
  kachel: KachelAnzeige;
  erneutVersuchen: () => void;
  laedt?: boolean;
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
        {kachel.zusatz && (
          <span className="text-[13px] text-gedaempft">{kachel.zusatz}</span>
        )}
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
