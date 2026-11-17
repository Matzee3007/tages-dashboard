import { useId, useState } from "react";
import { farbVariablen } from "@/lib/kacheln/kachel";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import type { Meldung } from "@/lib/kacheln/ki-news/feed";
import type { KiNewsDaten } from "@/lib/kacheln/typen";
import { alterText, istFrisch } from "@/lib/zeit";

// Schlagzeile (erste Meldung eines Absenders), sonst eine weitere Meldung. gross: die Schlagzeile der großen Karte.
type Rolle = "schlagzeile" | "gross" | "weitere";

const TITEL: Record<Rolle, string> = {
  gross:
    "block max-w-[22ch] pt-1 pb-1.5 text-2xl leading-[1.14] font-[760] tracking-[-0.022em] @[600px]:text-[28px]",
  schlagzeile:
    "block pb-1.5 text-xl leading-[1.24] font-[720] tracking-[-0.012em]",
  weitere: "block pb-1 text-[15px] leading-[1.32] font-semibold",
};

// Titel, darunter „Neu“ und das Alter (Mock G).
function MeldungsLink({
  meldung,
  jetzt,
  rolle,
}: {
  meldung: Meldung;
  jetzt: Date;
  rolle: Rolle;
}) {
  const Titel = rolle === "weitere" ? "span" : "h4";
  return (
    <a
      href={meldung.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block ${rolle === "weitere" ? "pt-2.5 pb-1" : "pt-2.5 pb-1.5"}`}
    >
      <Titel
        className={`${TITEL[rolle]} decoration-rauch underline-offset-3 group-hover:underline`}
      >
        {meldung.titel}
      </Titel>
      <span className="flex items-center gap-[7px] text-[12.5px] text-gedaempft">
        {istFrisch(meldung.zeit, jetzt, meldung.nurDatum) && (
          <span className="inline-flex items-center gap-1.5 font-[650] text-akzent">
            <span aria-hidden className="size-[7px] rounded-full bg-akzent" />
            Neu
          </span>
        )}
        {alterText(meldung.zeit, jetzt, meldung.nurDatum)}
      </span>
    </a>
  );
}

function MeldungsZeile({ meldung, rolle }: { meldung: Meldung; rolle: Rolle }) {
  // Ein Zeitpunkt für Punkt und Text, damit beide an der Grenze von 24 Std. zusammenpassen.
  const jetzt = new Date();
  if (meldung.zusammenfassung) {
    return (
      <ZeileMitZusammenfassung meldung={meldung} jetzt={jetzt} rolle={rolle} />
    );
  }
  return <MeldungsLink meldung={meldung} jetzt={jetzt} rolle={rolle} />;
}

// Mock vom 2026-11-15, Aussehen nach Mock G vom 2026-11-17: Der Titel öffnet das Original, „Zusammenfassung“ klappt nur auf.
// Die Zusammenfassung ist KI-generiert und reiner Text, React zeigt darin enthaltenes HTML als Zeichen (ADR 0010).
function ZeileMitZusammenfassung({
  meldung,
  jetzt,
  rolle,
}: {
  meldung: Meldung;
  jetzt: Date;
  rolle: Rolle;
}) {
  const [offen, setOffen] = useState(false);
  const kastenId = useId();
  return (
    <div>
      <MeldungsLink meldung={meldung} jetzt={jetzt} rolle={rolle} />
      <button
        type="button"
        aria-expanded={offen}
        aria-controls={kastenId}
        aria-label={`KI-Zusammenfassung ${offen ? "zuklappen" : "aufklappen"}`}
        onClick={() => setOffen(!offen)}
        className="-mt-1 inline-flex min-h-11 cursor-pointer items-center gap-1 text-[13px] font-semibold text-info"
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
        className="mt-0.5 mb-2.5 max-w-[66ch] rounded-xl bg-flaeche px-3.5 py-3 text-[14.5px] leading-[1.55] text-lesetext"
      >
        <span className="mb-1.5 inline-block rounded-md bg-info/12 px-[7px] py-px text-[11.5px] font-[650] text-info">
          KI-generiert
        </span>
        <br />
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

// Mock G: eine Karte je Absender, der neueste ist groß (zwei Spalten breit, Schlagzeile groß, weitere Meldungen daneben).
function AbsenderKarte({
  absender,
  gross,
}: {
  absender: AbsenderStand;
  gross: boolean;
}) {
  const [erste, ...weitere] = absender.meldungen;
  return (
    <section
      aria-label={absender.name}
      data-gross={gross || undefined}
      style={farbVariablen(absender.aussehen)}
      className={`flex min-w-0 flex-col rounded-2xl bg-karte ${
        gross
          ? "px-4 pt-3.5 pb-1.5 @[600px]:px-[22px] @[600px]:pt-5 @[600px]:pb-2.5 @[640px]:col-span-full @[900px]:col-span-2"
          : "px-4 pt-3.5 pb-1.5 @[600px]:px-[18px] @[600px]:pt-4 @[600px]:pb-2"
      }`}
    >
      <h3 className="flex items-center gap-2 text-[15px] font-[780] tracking-[-0.012em] text-(--farbe)">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-[3px] bg-(--marke)"
        />
        {absender.name}
      </h3>
      <div
        className={
          gross
            ? "@[900px]:grid @[900px]:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] @[900px]:gap-x-7"
            : undefined
        }
      >
        <MeldungsZeile
          meldung={erste}
          rolle={gross ? "gross" : "schlagzeile"}
        />
        {weitere.length > 0 && (
          <div
            className={`mt-2 [&>*]:border-t [&>*]:border-rand ${
              gross ? "@[900px]:mt-1 @[900px]:[&>*:first-child]:border-t-0" : ""
            }`}
          >
            {weitere.map((meldung) => (
              <MeldungsZeile
                key={meldung.link}
                meldung={meldung}
                rolle="weitere"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function RuhigeZeile({ absender }: { absender: AbsenderStand }) {
  return (
    <div className="col-span-full flex flex-wrap items-center gap-x-3.5 gap-y-1 rounded-2xl border border-dashed border-rand px-[18px] py-3.5 text-sm text-gedaempft">
      <span className="text-[15px] font-[780]">{absender.name}</span>
      {!absender.erreichbar ? (
        <span className="text-fehler">nicht erreichbar</span>
      ) : absender.letzteMeldung ? (
        <span>{`zuletzt ${alterText(absender.letzteMeldung)}`}</span>
      ) : (
        <span>noch keine Meldung</span>
      )}
    </div>
  );
}

export function KiNewsAnsicht({ daten }: { daten: KiNewsDaten }) {
  const aktiv = daten.absender.filter((a) => a.meldungen.length > 0);
  const ruhig = daten.absender.filter((a) => a.meldungen.length === 0);

  // Die Absender kommen nach ihrer neuesten Meldung sortiert, der erste ist also der mit der neuesten Meldung.
  return (
    // Container ist das umschließende Element: Eine Container-Abfrage prüft nur Vorfahren, nie das Element selbst.
    <div className="@container">
      <div className="grid items-start gap-4 @[640px]:grid-cols-2 @[900px]:grid-cols-3">
        {aktiv.map((absender, index) => (
          <AbsenderKarte
            key={absender.name}
            absender={absender}
            gross={index === 0}
          />
        ))}
        {ruhig.map((absender) => (
          <RuhigeZeile key={absender.name} absender={absender} />
        ))}
      </div>
    </div>
  );
}
