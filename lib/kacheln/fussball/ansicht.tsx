import { useId, useState } from "react";
import type { Zone } from "@/lib/einstellungen";
import type {
  FussballDaten,
  Partie,
  TabellenZeile,
  TeamStand,
} from "@/lib/kacheln/fussball/typen";
import { spieltagTag } from "@/lib/kacheln/fussball/spieltag";
import { datum, tageText, uhrzeit } from "@/lib/zeit";

export const MEIN_TEAM_GRUND = "bg-akzent/10";

// Direkt von ESPN, ohne next/image (Projektvision: Logos lädt der Browser beim Anbieter). Fehlt das Bild, bleibt der Platz.
export function Logo({ url }: { url: string | null }) {
  if (!url) return <span aria-hidden className="size-5 shrink-0" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      className="size-5 shrink-0 object-contain"
      onError={(ereignis) => {
        ereignis.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}

// heim: Name vor dem Logo, rechtsbündig zum Feld hin (Mock G).
export function Team({
  team,
  mein,
  heim = false,
}: {
  team: TeamStand;
  mein: boolean;
  heim?: boolean;
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-2 ${heim ? "flex-row-reverse text-right" : ""}`}
    >
      <Logo url={team.logo} />
      <span className={`truncate ${mein ? "font-[720] text-akzent" : ""}`}>
        {team.name}
      </span>
    </span>
  );
}

function Feld({ partie }: { partie: Partie }) {
  const live = partie.status === "laeuft";
  const text =
    partie.status === "abgesagt"
      ? "abgesagt"
      : partie.heim.tore === null
        ? uhrzeit(partie.anstoss)
        : `${partie.heim.tore} – ${partie.gast.tore}`;
  const art =
    partie.status === "abgesagt"
      ? "text-[11.5px] font-semibold text-gedaempft"
      : partie.heim.tore === null
        ? "text-[13.5px] font-semibold text-gedaempft"
        : live
          ? "bg-akzent/10 text-[15.5px] font-[760] text-akzent ring-1 ring-akzent/45 ring-inset"
          : "bg-flaeche text-[15.5px] font-[760]";
  return (
    <span
      data-testid="feld"
      className={`grid h-[30px] min-w-[54px] place-items-center justify-self-center rounded-lg px-1.5 whitespace-nowrap ${art}`}
    >
      {text}
    </span>
  );
}

function ToreListe({
  partie,
  seite,
}: {
  partie: Partie;
  seite: "heim" | "gast";
}) {
  return (
    <ul
      data-seite={seite}
      className={`mt-1 min-w-0 text-[11.5px] leading-[1.45] text-rauch ${
        seite === "heim" ? "col-start-2 text-right" : "col-start-4"
      }`}
    >
      {partie.tore
        .filter((tor) => tor.seite === seite)
        .map((tor, index) => (
          <li key={index} className="truncate">
            {tor.text}
          </li>
        ))}
    </ul>
  );
}

// Variante A aus dem Mock vom 2026-11-17: Knopf mittig unter dem Ergebnis, der Kasten klappt über die ganze Breite auf.
// Der Bericht ist KI-generiert und reiner Text, React zeigt darin enthaltenes HTML als Zeichen (ADR 0013).
function Spielbericht({ bericht }: { bericht: string }) {
  const [offen, setOffen] = useState(false);
  const kastenId = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={offen}
        aria-controls={kastenId}
        aria-label={`KI-Spielbericht ${offen ? "zuklappen" : "aufklappen"}`}
        onClick={() => setOffen(!offen)}
        className="col-span-3 col-start-2 -mt-1.5 -mb-2.5 inline-flex min-h-11 cursor-pointer items-center gap-1 justify-self-center px-2.5 text-[13px] font-semibold text-info"
      >
        Bericht
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
      {/* Immer im DOM, damit aria-controls auch zugeklappt auf ein Element zeigt (wie bei den KI-News). */}
      <div
        id={kastenId}
        hidden={!offen}
        className="col-span-4 mt-1.5 mb-1 ml-1.5 max-w-[66ch] rounded-xl bg-flaeche px-3.5 py-3 text-[14.5px] leading-[1.55] font-normal text-lesetext"
      >
        <span className="mb-1.5 inline-block rounded-md bg-info/12 px-[7px] py-px text-[11.5px] font-[650] text-info">
          KI-generiert
        </span>
        <br />
        {bericht}
      </div>
    </>
  );
}

// Symmetrisch um das Feld mit Ergebnis oder Anstoß, Torschützen unter ihrem Team (Mock G).
// mitBericht: In der Übersicht „Heute“ bleibt der Spielbericht weg, er steht in der Kachel (ADR 0014).
export function PartieZeile({
  partie,
  meinTeam,
  mitBericht = true,
}: {
  partie: Partie;
  meinTeam: string[];
  mitBericht?: boolean;
}) {
  const mein =
    meinTeam.includes(partie.heim.id) || meinTeam.includes(partie.gast.id);
  const live = partie.status === "laeuft";
  return (
    <div
      data-testid={`partie-${partie.id}`}
      data-mein-team={mein || undefined}
      className={`grid min-h-[52px] grid-cols-[36px_minmax(0,1fr)_58px_minmax(0,1fr)] items-center gap-x-2 border-t border-rand py-[9px] pr-3 pl-1.5 text-sm font-medium [[aria-hidden]+&]:border-t-0 ${
        mein ? MEIN_TEAM_GRUND : ""
      }`}
    >
      <span
        className={`flex flex-col items-center gap-0.5 text-center text-[11.5px] leading-[1.1] font-semibold ${
          live ? "text-akzent" : "text-rauch"
        }`}
      >
        {live ? (
          <>
            <span aria-label="live" role="img">
              ●
            </span>
            {partie.minute ?? ""}
          </>
        ) : partie.status === "vorbei" ? (
          "Ende"
        ) : null}
      </span>
      <Team team={partie.heim} mein={meinTeam.includes(partie.heim.id)} heim />
      <Feld partie={partie} />
      <Team team={partie.gast} mein={meinTeam.includes(partie.gast.id)} />
      {partie.tore.length > 0 && (
        <>
          <ToreListe partie={partie} seite="heim" />
          <ToreListe partie={partie} seite="gast" />
        </>
      )}
      {mitBericht && partie.bericht && (
        <Spielbericht bericht={partie.bericht} />
      )}
    </div>
  );
}

// Aufeinanderfolgende Partien desselben deutschen Tages unter einer Tageszeile, Schlüssel wie beim Sortieren.
export function nachTagen(
  partien: Partie[],
): { tag: string; partien: Partie[] }[] {
  const tage: { tag: string; partien: Partie[] }[] = [];
  for (const partie of partien) {
    const tag = spieltagTag(partie);
    const letzter = tage.at(-1);
    if (letzter?.tag === tag) letzter.partien.push(partie);
    else tage.push({ tag, partien: [partie] });
  }
  return tage;
}

export function zoneVon(zonen: Zone[], platz: number): Zone | undefined {
  return zonen.find((zone) => platz >= zone.von && platz <= zone.bis);
}

// Eine Linie trennt zwei Zonen, nur wenn die nächste Zeile direkt folgt (keine Lücke). Höher statt genau +1: Bei gleichem
// Platz (4, 4, 6) steht sie unter dem letzten der beiden.
function grenzeNach(
  zonen: Zone[],
  zeile: TabellenZeile,
  naechste: TabellenZeile | null | undefined,
): boolean {
  return (
    !!naechste &&
    naechste.platz > zeile.platz &&
    zoneVon(zonen, zeile.platz) !== zoneVon(zonen, naechste.platz)
  );
}

export function Legende({ zonen }: { zonen: Zone[] }) {
  if (zonen.length === 0) return null;
  return (
    <ul
      aria-label="Zonen"
      className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-0.5 text-[11.5px] text-gedaempft"
    >
      {zonen.map((zone) => (
        <li
          key={`${zone.von}-${zone.bis}`}
          className="inline-flex items-center gap-1.5"
        >
          <span
            aria-hidden
            className="size-2 rounded-[2px]"
            style={{ background: zone.farbe }}
          />
          {zone.name}
        </li>
      ))}
    </ul>
  );
}

function TabellenZeilen({
  zeile,
  meinTeam,
  zone,
  linie,
}: {
  zeile: TabellenZeile | null;
  meinTeam: string[];
  zone: Zone | undefined;
  linie: boolean;
}) {
  if (!zeile) {
    return (
      <tr>
        <td
          colSpan={5}
          className="h-4 text-center text-xs tracking-[.3em] text-rauch"
        >
          ···
        </td>
      </tr>
    );
  }
  const mein = meinTeam.includes(zeile.id);
  const zelle = `h-8 py-[3px] ${mein ? MEIN_TEAM_GRUND : ""} ${
    linie ? "border-b border-b-grenze" : ""
  }`;
  return (
    <tr
      data-mein-team={mein || undefined}
      data-zone={zone?.name}
      data-linie={linie || undefined}
    >
      <td className={`${zelle} w-9 text-[12.5px] font-semibold text-gedaempft`}>
        <span className="flex items-center gap-[9px]">
          <span
            aria-hidden
            className="h-[18px] w-[3px] rounded-[2px]"
            style={{ background: zone?.farbe ?? "transparent" }}
          />
          {zeile.platz}
        </span>
      </td>
      <td className={`${zelle} max-w-0`}>
        <Team team={{ ...zeile, tore: null }} mein={mein} />
      </td>
      <td className={`${zelle} w-[34px] text-right text-gedaempft`}>
        {zeile.spiele}
      </td>
      <td className={`${zelle} w-[34px] text-right text-gedaempft`}>
        {zeile.differenz > 0 ? `+${zeile.differenz}` : zeile.differenz}
      </td>
      <td className={`${zelle} w-9 pr-1 text-right font-[720]`}>
        {zeile.punkte}
      </td>
    </tr>
  );
}

export function FussballAnsicht({
  daten,
  ebene = 4,
}: {
  daten: FussballDaten;
  ebene?: 3 | 4;
}) {
  const tage = daten.tage.length > 0 ? tageText(daten.tage) : "";
  const ueberschrift = [daten.titel, tage].filter(Boolean).join(" · ");
  const Ueberschrift = ebene === 3 ? "h3" : "h4";
  return (
    <>
      <div>
        <Ueberschrift className="-mt-2.5 pr-3.5 pb-2.5 pl-[62px] text-[12.5px] text-gedaempft">
          {ueberschrift || "Spieltag"}
        </Ueberschrift>
        {nachTagen(daten.partien).map(({ tag, partien }) => (
          <div key={tag} role="group" aria-label={datum(partien[0].anstoss)}>
            <div
              aria-hidden
              className="bg-flaeche px-3.5 py-1.5 text-[12.5px] font-[650] text-gedaempft"
            >
              {datum(partien[0].anstoss)}
            </div>
            {partien.map((partie) => (
              <PartieZeile
                key={partie.id}
                partie={partie}
                meinTeam={daten.meinTeam}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-rand px-3.5 pt-3 pb-3.5">
        <Ueberschrift className="mb-1.5 text-[13.5px] font-[720]">
          Tabelle
        </Ueberschrift>
        {daten.tabelle === null ? (
          <p className="text-[13.5px] text-gedaempft">
            Tabelle gerade nicht erreichbar
          </p>
        ) : (
          <>
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr className="text-[11.5px] text-rauch">
                  <th className="pb-1 text-left font-medium">#</th>
                  <th className="pb-1 text-left font-medium">Team</th>
                  <th className="pb-1 text-right font-medium">Sp</th>
                  <th className="pb-1 text-right font-medium">+/−</th>
                  <th className="pb-1 text-right font-medium">Pkt</th>
                </tr>
              </thead>
              <tbody>
                {daten.tabelle.map((zeile, index, alle) => (
                  <TabellenZeilen
                    key={zeile?.id ?? `luecke-${index}`}
                    zeile={zeile}
                    meinTeam={daten.meinTeam}
                    zone={zeile ? zoneVon(daten.zonen, zeile.platz) : undefined}
                    linie={
                      !!zeile && grenzeNach(daten.zonen, zeile, alle[index + 1])
                    }
                  />
                ))}
              </tbody>
            </table>
            <Legende
              zonen={daten.zonen.filter((zone) =>
                daten.tabelle?.some(
                  (zeile) => zeile && zoneVon([zone], zeile.platz),
                ),
              )}
            />
          </>
        )}
      </div>
    </>
  );
}
