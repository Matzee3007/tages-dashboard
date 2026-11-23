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
        className="mt-2 min-h-11 cursor-pointer rounded-full bg-knopf px-4 font-semibold disabled:cursor-default disabled:opacity-50"
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
  const kopfRechts = (
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
          className="grid size-11 cursor-pointer place-items-center rounded-full text-lg text-gedaempft hover:bg-knopf hover:text-text disabled:cursor-default"
        >
          <span aria-hidden className={holtFrisch ? "animate-spin" : undefined}>
            ↻
          </span>
        </button>
      )}
    </div>
  );
  const fehler = kachel.fehler && (
    <FehlerHinweis
      stand={kachel.stand}
      erneutVersuchen={erneutVersuchen}
      laedt={laedt}
    />
  );

  // Ohne Gruppe trägt die Kachel selbst den großen Titel und ihre Inhalte bringen eigene Karten mit (KI-News).
  if (!kachel.gruppe) {
    return (
      <section
        id={kachel.id}
        aria-label={kachel.titel}
        style={farbVariablen(kachel.aussehen)}
        className="flex min-w-0 scroll-mt-4 flex-col gap-3.5"
      >
        <div className="flex items-center justify-between gap-2">
          <GrosserTitel>{kachel.titel}</GrosserTitel>
          {kopfRechts}
        </div>
        {fehler && <div className="rounded-xl bg-karte p-3.5">{fehler}</div>}
        {children}
      </section>
    );
  }

  // In einer Gruppe ist die Kachel eine Karte unter der Überschrift der Gruppe (Mock G).
  return (
    <section
      id={kachel.id}
      aria-label={kachel.titel}
      style={farbVariablen(kachel.aussehen)}
      className="flex min-w-0 scroll-mt-4 flex-col overflow-hidden rounded-2xl bg-karte"
    >
      <div className="flex items-center gap-3 py-3 pr-1 pl-3.5">
        <span
          aria-hidden
          className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-(--marke) text-[12.5px] font-[800] tracking-[-0.01em] text-white"
        >
          {kachel.aussehen.kuerzel}
        </span>
        <h3 className="min-w-0 flex-1 text-[16.5px] leading-[1.2] font-[740] tracking-[-0.01em]">
          {kachel.titel}
        </h3>
        {kopfRechts}
      </div>
      {fehler && (
        <div className="mx-3.5 mb-3.5 rounded-xl bg-flaeche p-3.5">
          {fehler}
        </div>
      )}
      {children}
    </section>
  );
}

// Gruppentitel und Titel einer Kachel ohne Gruppe sehen gleich aus (Mock G).
export function GrosserTitel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[26px] leading-[1.1] font-[780] tracking-[-0.022em] min-[600px]:text-[28px]">
      {children}
    </h2>
  );
}
