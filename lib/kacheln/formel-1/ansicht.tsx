import type { ReactNode } from "react";
import type {
  ErgebnisZeile,
  Formel1Daten,
  Session,
  WertungsZeile,
} from "@/lib/kacheln/formel-1/typen";
import { heute, tageText, uhrzeit } from "@/lib/zeit";

// Mock Formel 1 (assets/mocks/2026-11-26-formel-1.html): die nächste Session nur mit blauem Randstreifen und Ring, ohne Pille.

function wochentag(iso: string): string {
  return tageText([heute(new Date(iso))]).split(" ")[0];
}

function SessionZeile({
  session,
  naechste,
}: {
  session: Session;
  naechste: boolean;
}) {
  const laeuft = session.status === "laeuft";
  const vorbei = session.status === "vorbei";
  return (
    <li
      data-status={session.status}
      data-naechste={naechste || undefined}
      className={`flex items-center gap-3 border-t border-rand px-3.5 py-2 text-[14px] ${
        laeuft ? "bg-akzent/10" : ""
      } ${naechste ? "border-l-[3px] border-l-info pl-[11px]" : ""} ${vorbei ? "text-rauch" : ""}`}
    >
      <span
        aria-hidden
        className={`grid size-4 shrink-0 place-items-center rounded-full text-[10px] ${
          laeuft
            ? "bg-akzent"
            : vorbei
              ? "bg-flaeche text-gedaempft"
              : naechste
                ? "ring-2 ring-info"
                : "ring-1 ring-rand"
        }`}
      >
        {vorbei ? "✓" : ""}
      </span>
      <span className="flex-1 font-semibold">{session.name}</span>
      {laeuft && (
        <span className="text-[12.5px] font-[650] text-akzent">läuft</span>
      )}
      <span className="text-[12.5px] text-gedaempft tabular-nums">
        {session.ohneZeit
          ? wochentag(session.start)
          : `${wochentag(session.start)} ${uhrzeit(session.start)}`}
      </span>
    </li>
  );
}

function Tabelle({
  name,
  kopf,
  children,
}: {
  name: string;
  kopf: ReactNode;
  children: ReactNode;
}) {
  return (
    <table aria-label={name} className="w-full border-collapse text-[13.5px]">
      <caption className="mb-1 text-left text-[12.5px] font-[650] text-gedaempft">
        {name}
      </caption>
      <thead>
        <tr className="text-[11.5px] text-rauch">{kopf}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

const ZELLE = "h-8 border-t border-rand py-[3px]";

function ErgebnisTabelle({
  name,
  zeilen,
}: {
  name: string;
  zeilen: ErgebnisZeile[];
}) {
  return (
    <Tabelle
      name={name}
      kopf={
        <>
          <th className="pb-1 text-left font-medium">#</th>
          <th className="pb-1 text-left font-medium">Fahrer</th>
          <th className="pb-1 text-right font-medium">Zeit</th>
        </>
      }
    >
      {zeilen.map((zeile) => (
        <tr key={zeile.platz}>
          <td
            className={`${ZELLE} w-8 text-[12.5px] font-semibold text-gedaempft`}
          >
            {zeile.platz}
          </td>
          <td className={`${ZELLE} max-w-0 truncate`}>
            <span className="font-semibold">{zeile.name}</span>{" "}
            <span className="text-[12.5px] text-gedaempft">{zeile.team}</span>
          </td>
          <td
            className={`${ZELLE} w-24 pr-1 text-right font-[720] tabular-nums`}
          >
            {zeile.zeit}
          </td>
        </tr>
      ))}
    </Tabelle>
  );
}

function WertungsTabelle({
  name,
  zeilen,
}: {
  name: string;
  zeilen: WertungsZeile[];
}) {
  return (
    <Tabelle
      name={name}
      kopf={
        <>
          <th className="pb-1 text-left font-medium">#</th>
          <th className="pb-1 text-left font-medium">
            {name === "Fahrer" ? "Fahrer" : "Team"}
          </th>
          <th className="pb-1 text-right font-medium">Pkt</th>
        </>
      }
    >
      {zeilen.map((zeile) => (
        <tr key={zeile.platz}>
          <td
            className={`${ZELLE} w-8 text-[12.5px] font-semibold text-gedaempft`}
          >
            {zeile.platz}
          </td>
          <td className={`${ZELLE} max-w-0 truncate`}>
            <span className="font-semibold">{zeile.name}</span>
            {zeile.team && (
              <span className="text-[12.5px] text-gedaempft">
                {" "}
                {zeile.team}
              </span>
            )}
          </td>
          <td
            className={`${ZELLE} w-14 pr-1 text-right font-[720] tabular-nums`}
          >
            {zeile.punkte}
          </td>
        </tr>
      ))}
    </Tabelle>
  );
}

export function Formel1Ansicht({
  daten,
  ebene = 4,
}: {
  daten: Formel1Daten;
  ebene?: 3 | 4;
}) {
  const Ueberschrift = ebene === 3 ? "h3" : "h4";
  const { rennen } = daten;
  const tage = [
    ...new Set(rennen.sessions.map((s) => heute(new Date(s.start)))),
  ].sort();
  const naechste = rennen.sessions.find(
    (session) => session.status === "vorher",
  );
  return (
    <>
      <div className="-mt-1.5 px-3.5 pb-2.5">
        <p className="text-[15px] font-[720]">
          {rennen.name} · {rennen.ort}
        </p>
        <p className="text-[12.5px] text-gedaempft">
          Runde {rennen.runde} von {daten.letzteRunde} · {tageText(tage)}
        </p>
      </div>
      {daten.winterpause ? (
        <p className="border-t border-rand px-3.5 py-2.5 text-[13.5px] text-gedaempft">
          <strong className="font-[720] text-text">Winterpause.</strong>
          {daten.saisonstart &&
            ` Saisonstart: ${daten.saisonstart.name}, ${tageText(daten.saisonstart.tage)}`}
        </p>
      ) : (
        <div>
          <div
            aria-hidden
            className="bg-flaeche px-3.5 py-1.5 text-[12.5px] font-[650] text-gedaempft"
          >
            Rennwochenende
          </div>
          <ul aria-label="Rennwochenende">
            {rennen.sessions.map((session) => (
              <SessionZeile
                key={session.art}
                session={session}
                naechste={session === naechste}
              />
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-3 border-t border-rand px-3.5 pt-3 pb-3.5">
        {daten.ergebnis && (
          <ErgebnisTabelle
            name={
              daten.ergebnis.art === "rennen" ? "Rennergebnis" : "Qualifying"
            }
            zeilen={daten.ergebnis.zeilen}
          />
        )}
        <Ueberschrift className="text-[13.5px] font-[720]">
          {!daten.wertungNachRunde
            ? "WM-Wertung"
            : `WM-Wertung nach Runde ${daten.wertungNachRunde}`}
        </Ueberschrift>
        {daten.fahrer === null && daten.teams === null ? (
          <p className="text-[13.5px] text-gedaempft">
            WM-Wertung gerade nicht erreichbar
          </p>
        ) : !daten.fahrer?.length && !daten.teams?.length ? (
          <p className="text-[13.5px] text-gedaempft">Noch keine WM-Wertung</p>
        ) : (
          <>
            {!!daten.fahrer?.length && (
              <WertungsTabelle name="Fahrer" zeilen={daten.fahrer} />
            )}
            {!!daten.teams?.length && (
              <WertungsTabelle name="Teams" zeilen={daten.teams} />
            )}
          </>
        )}
      </div>
    </>
  );
}
