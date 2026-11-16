import type { CSSProperties, ReactNode } from "react";
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
  // Farbe nur als Akzent: Quadrat im Kopf, Grenzlinie, Name des Absenders (Mock F).
  const farben = {
    "--farbe": kachel.aussehen.farbe,
    "--marke": kachel.aussehen.marke ?? kachel.aussehen.farbe,
  } as CSSProperties;
  return (
    <section
      aria-label={kachel.titel}
      style={farben}
      className="flex min-w-0 flex-col gap-3"
    >
      <div className="-mr-3 flex min-h-11 items-center gap-2.5">
        <span
          aria-hidden
          className="size-[9px] shrink-0 rounded-[2px] bg-(--marke)"
        />
        <h2 className="flex-1 text-base font-[720] tracking-[-0.005em]">
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
