import type { ReactNode } from "react";
import { PartieZeile } from "@/lib/kacheln/fussball/ansicht";
import { farbVariablen } from "@/lib/kacheln/kachel";
import { MeldungsLink } from "@/lib/kacheln/ki-news/ansicht";
import type {
  Herkunft,
  LiveEintrag,
  Uebersicht,
} from "@/lib/kacheln/uebersicht";
import { datum } from "@/lib/zeit";

const WEITERE_MELDUNGEN = 6;

// „2 Partien, 1 Session“: Partien und Sessions der Formel 1 getrennt gezählt.
function liveText(live: LiveEintrag[]): string {
  const partien = live.filter((eintrag) => "partie" in eintrag).length;
  const sessions = live.length - partien;
  return [
    partien && `${partien} ${partien === 1 ? "Partie" : "Partien"}`,
    sessions && `${sessions} ${sessions === 1 ? "Session" : "Sessions"}`,
  ]
    .filter(Boolean)
    .join(", ");
}

// Eine Karte der Übersicht, Kopf wie eine Kachel in einer Gruppe (Mock Variante D, `dHeute`).
function Karte({
  titel,
  untertitel,
  marke,
  children,
}: {
  titel: string;
  untertitel: string;
  marke: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={titel}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-karte"
    >
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span
          aria-hidden
          className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-flaeche text-[12.5px] font-[800] text-akzent"
        >
          {marke}
        </span>
        <div className="min-w-0">
          <h3 className="text-[16.5px] leading-[1.2] font-[740] tracking-[-0.01em]">
            {titel}
          </h3>
          <p className="text-[12.5px] text-gedaempft">{untertitel}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Weiter({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 w-full cursor-pointer items-center justify-between border-t border-rand px-3.5 text-[13.5px] font-semibold text-gedaempft hover:text-text"
    >
      {text}
      <span aria-hidden>›</span>
    </button>
  );
}

// Kleine Zeile über einer Partie: Marke und Name des Wettbewerbs, bei Bedarf der Tag. Ein Tipp führt zur Kachel.
function Herkunftszeile({
  herkunft,
  zusatz,
  waehle,
}: {
  herkunft: Herkunft;
  zusatz?: string;
  waehle: (reiter: string, kachelId?: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => waehle(herkunft.reiter, herkunft.kachelId)}
      style={farbVariablen(herkunft.aussehen)}
      className="flex min-h-8 w-full cursor-pointer items-center gap-2 bg-flaeche px-3.5 py-1.5 text-left text-[12.5px] font-[650] text-gedaempft hover:text-text"
    >
      <span
        aria-hidden
        className="grid h-[18px] min-w-[22px] place-items-center rounded-[5px] bg-(--marke) px-1 text-[10px] font-[800] text-white"
      >
        {herkunft.aussehen.kuerzel}
      </span>
      <span className="flex-1">
        {[herkunft.titel, zusatz].filter(Boolean).join(" · ")}
      </span>
      <span aria-hidden>›</span>
    </button>
  );
}

// jetzt: dieselbe Uhrzeit wie beim Auswählen der neuen Meldungen, damit gezählte Meldungen auch das Etikett „Neu“ tragen.
export function Heute({
  uebersicht,
  jetzt,
  waehle,
}: {
  uebersicht: Uebersicht;
  jetzt: Date;
  waehle: (reiter: string, kachelId?: string) => void;
}) {
  const { live, meinTeam, neu, newsReiter, fehler } = uebersicht;
  const [erste, ...weitere] = neu;
  return (
    <div className="grid items-start gap-4 min-[900px]:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4">
        {fehler.length > 0 && (
          <Karte
            titel="Gerade nicht erreichbar"
            untertitel="Letzter Stand in der Kachel, neuer Versuch in 1 Minute"
            marke="!"
          >
            {fehler.map((herkunft) => (
              <Herkunftszeile
                key={herkunft.kachelId}
                herkunft={herkunft}
                waehle={waehle}
              />
            ))}
          </Karte>
        )}
        {live.length > 0 && (
          <Karte
            titel="Jetzt live"
            untertitel={liveText(live)}
            marke={<span className="size-2.5 rounded-full bg-akzent" />}
          >
            {live.map((eintrag) =>
              "partie" in eintrag ? (
                <div key={eintrag.partie.id}>
                  <Herkunftszeile herkunft={eintrag} waehle={waehle} />
                  <PartieZeile
                    partie={eintrag.partie}
                    meinTeam={eintrag.meinTeam}
                    mitBericht={false}
                  />
                </div>
              ) : (
                <div key={`${eintrag.kachelId}-${eintrag.session}`}>
                  <Herkunftszeile herkunft={eintrag} waehle={waehle} />
                  <p className="flex items-center gap-2 border-t border-rand px-3.5 py-2.5 text-[14px] font-semibold">
                    <span
                      aria-hidden
                      className="size-[7px] rounded-full bg-akzent"
                    />
                    {`${eintrag.session} läuft · ${eintrag.rennen}`}
                  </p>
                </div>
              ),
            )}
            <Weiter
              text={`Alles im Reiter ${live[0].reiter}`}
              onClick={() => waehle(live[0].reiter)}
            />
          </Karte>
        )}
        {meinTeam.length > 0 && (
          <Karte
            titel="Mein Team"
            untertitel="Nächste oder letzte Partie, Platz"
            marke="★"
          >
            {meinTeam.map((team) => (
              <div
                key={`${team.art}-${team.id}`}
                className="border-t border-rand first:border-t-0"
              >
                <p className="px-3.5 pt-3 pb-1.5 text-[15px] font-[740]">
                  {team.name}
                </p>
                {team.wettbewerbe.map(
                  (wettbewerb) =>
                    wettbewerb.partie && (
                      <div key={wettbewerb.kachelId}>
                        <Herkunftszeile
                          herkunft={wettbewerb}
                          zusatz={datum(wettbewerb.partie.anstoss)}
                          waehle={waehle}
                        />
                        <PartieZeile
                          partie={wettbewerb.partie}
                          meinTeam={[team.id]}
                          mitBericht={false}
                        />
                      </div>
                    ),
                )}
                <div className="flex flex-wrap gap-2 px-3.5 pt-1 pb-3">
                  {team.wettbewerbe.map(
                    (wettbewerb) =>
                      wettbewerb.platz && (
                        <span
                          key={wettbewerb.kachelId}
                          style={farbVariablen(wettbewerb.aussehen)}
                          className="flex items-center gap-1.5 rounded-full bg-flaeche py-1 pr-2.5 pl-1 text-[12.5px] text-gedaempft"
                        >
                          <span
                            aria-hidden
                            className="grid h-[18px] min-w-[22px] place-items-center rounded-full bg-(--marke) px-1 text-[10px] font-[800] text-white"
                          >
                            {wettbewerb.aussehen.kuerzel}
                          </span>
                          <span>{wettbewerb.platz.text}</span>
                        </span>
                      ),
                  )}
                </div>
              </div>
            ))}
          </Karte>
        )}
      </div>
      {newsReiter && (
        <Karte
          titel="Neu in den KI-News"
          untertitel={
            neu.length === 0
              ? "Keine neue Meldung"
              : `${neu.length} neue ${neu.length === 1 ? "Meldung" : "Meldungen"}, neueste zuerst`
          }
          marke="KI"
        >
          {erste ? (
            <div className="px-3.5 pb-2">
              <div style={farbVariablen(erste.aussehen)}>
                <p className="text-[13px] font-[720] text-(--farbe)">
                  {erste.absender}
                </p>
                <MeldungsLink
                  meldung={erste.meldung}
                  jetzt={jetzt}
                  rolle="schlagzeile"
                />
              </div>
              {weitere.slice(0, WEITERE_MELDUNGEN).map((eintrag) => (
                <div
                  key={`${eintrag.absender}-${eintrag.meldung.link}`}
                  style={farbVariablen(eintrag.aussehen)}
                  className="border-t border-rand"
                >
                  <p className="pt-2 text-[12px] font-[720] text-(--farbe)">
                    {eintrag.absender}
                  </p>
                  <MeldungsLink
                    meldung={eintrag.meldung}
                    jetzt={jetzt}
                    rolle="weitere"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="px-3.5 pb-3 text-[14px] text-gedaempft">
              Gerade nichts Neues
            </p>
          )}
          <Weiter
            text={`Alle Meldungen im Reiter ${newsReiter}`}
            onClick={() => waehle(newsReiter)}
          />
        </Karte>
      )}
    </div>
  );
}
