import { Abschnitt } from "@/lib/kacheln/kachel";
import type {
  FussballDaten,
  Partie,
  TabellenZeile,
  TeamStand,
} from "@/lib/kacheln/fussball/typen";
import { anstossText, tageText } from "@/lib/zeit";

const MEIN_TEAM_STIL =
  "rounded-md bg-akzent/8 shadow-[inset_3px_0_0_var(--color-akzent)]";

// Direkt von ESPN, ohne next/image (Projektvision: Logos lädt der Browser beim Anbieter). Fehlt das Bild, bleibt der Platz.
function Logo({ url }: { url: string | null }) {
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

function Team({ team, mein }: { team: TeamStand; mein: boolean }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Logo url={team.logo} />
      <span className={`truncate ${mein ? "font-[650] text-akzent" : ""}`}>
        {team.name}
      </span>
    </span>
  );
}

function PartieZeile({
  partie,
  meinTeam,
}: {
  partie: Partie;
  meinTeam: string[];
}) {
  const mein =
    meinTeam.includes(partie.heim.id) || meinTeam.includes(partie.gast.id);
  const live = partie.status === "laeuft";
  const ergebnis =
    partie.heim.tore === null ? "" : `${partie.heim.tore}:${partie.gast.tore}`;
  return (
    <div
      data-testid={`partie-${partie.id}`}
      data-mein-team={mein || undefined}
      className={`-mx-2 grid min-h-9 grid-cols-[58px_minmax(0,1fr)_34px] items-center gap-x-2 px-2 py-[3px] ${
        mein ? MEIN_TEAM_STIL : ""
      }`}
    >
      <span
        className={`text-[12.5px] whitespace-nowrap ${
          live ? "font-[650] text-akzent" : "text-gedaempft"
        }`}
      >
        {live ? (
          <>
            <span aria-label="live" role="img">
              ●
            </span>{" "}
            {partie.minute ?? ""}
          </>
        ) : partie.status === "abgesagt" ? (
          "abgesagt"
        ) : (
          anstossText(partie.anstoss)
        )}
      </span>
      <span className="flex min-w-0 items-center gap-[5px] text-sm font-[420] whitespace-nowrap">
        <Team team={partie.heim} mein={meinTeam.includes(partie.heim.id)} />
        <span className="text-rauch">–</span>
        <Team team={partie.gast} mein={meinTeam.includes(partie.gast.id)} />
      </span>
      <span
        className={`text-right text-sm font-bold whitespace-nowrap ${
          live ? "text-akzent" : ""
        }`}
      >
        {ergebnis}
      </span>
      {partie.tore.length > 0 && (
        <p className="col-span-2 col-start-2 -mt-0.5 text-[12.5px] text-rauch">
          {partie.tore.map((tor) => tor.text).join(" · ")}
        </p>
      )}
    </div>
  );
}

function TabellenZeilen({
  zeile,
  meinTeam,
  linie,
}: {
  zeile: TabellenZeile | null;
  meinTeam: string[];
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
  const zelle = `h-[30px] py-[3px] ${mein ? "bg-akzent/8" : ""} ${
    linie ? "border-b-[1.5px] border-b-(--farbe)" : ""
  }`;
  return (
    <tr data-mein-team={mein || undefined} data-linie={linie || undefined}>
      <td
        className={`${zelle} w-[26px] pr-2.5 text-right text-rauch ${
          mein ? "rounded-l-md shadow-[inset_3px_0_0_var(--color-akzent)]" : ""
        }`}
      >
        {zeile.platz}
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
      <td
        className={`${zelle} w-[34px] text-right font-bold ${
          mein ? "rounded-r-md pr-2" : ""
        }`}
      >
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
  return (
    <>
      <Abschnitt titel={ueberschrift || "Spieltag"} ebene={ebene}>
        <div className="flex flex-col">
          {daten.partien.map((partie) => (
            <PartieZeile
              key={partie.id}
              partie={partie}
              meinTeam={daten.meinTeam}
            />
          ))}
        </div>
      </Abschnitt>
      <Abschnitt titel="Tabelle" ebene={ebene}>
        {daten.tabelle === null ? (
          <p className="text-gedaempft">Tabelle gerade nicht erreichbar</p>
        ) : (
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr className="text-xs text-rauch">
                <th className="pb-1 pr-2.5 text-right font-medium">#</th>
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
                  linie={
                    zeile !== null &&
                    daten.linien.includes(zeile.platz) &&
                    // Höher statt genau +1: Bei gleichem Platz (4, 4, 6) steht die Linie unter dem letzten der beiden.
                    (alle[index + 1]?.platz ?? 0) > zeile.platz
                  }
                />
              ))}
            </tbody>
          </table>
        )}
      </Abschnitt>
    </>
  );
}
