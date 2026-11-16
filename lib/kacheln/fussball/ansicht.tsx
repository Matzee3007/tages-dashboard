import { Abschnitt } from "@/lib/kacheln/kachel";
import type {
  FussballDaten,
  Partie,
  TabellenZeile,
  TeamStand,
} from "@/lib/kacheln/fussball/typen";
import { anstossText, tageText } from "@/lib/zeit";

const MEIN_TEAM_STIL =
  "rounded-[10px] bg-akzent/8 shadow-[inset_3px_0_0_var(--color-akzent)]";

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
      <span className={mein ? "font-semibold" : undefined}>{team.name}</span>
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
      className={`flex min-h-11 flex-col justify-center border-t border-rand py-1.5 first:border-t-0 ${
        mein ? `-mx-2.5 border-t-transparent px-2.5 ${MEIN_TEAM_STIL}` : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`w-[58px] shrink-0 text-[13px] whitespace-nowrap ${
            live ? "font-semibold text-akzent" : "text-gedaempft"
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
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px] font-medium whitespace-nowrap">
          <Team team={partie.heim} mein={meinTeam.includes(partie.heim.id)} />
          <span className="text-gedaempft">–</span>
          <Team team={partie.gast} mein={meinTeam.includes(partie.gast.id)} />
        </span>
        <span
          className={`min-w-[30px] shrink-0 text-right text-[15px] font-semibold whitespace-nowrap tabular-nums ${
            live ? "text-akzent" : ""
          }`}
        >
          {ergebnis}
        </span>
      </div>
      {partie.tore.length > 0 && (
        <p className="mt-0.5 ml-[68px] text-[13px] text-gedaempft">
          {partie.tore.map((tor) => tor.text).join(" · ")}
        </p>
      )}
    </div>
  );
}

function TabellenZeilen({
  zeile,
  meinTeam,
}: {
  zeile: TabellenZeile | null;
  meinTeam: string[];
}) {
  if (!zeile) {
    return (
      <tr>
        <td
          colSpan={5}
          className="h-[18px] text-center text-[13px] tracking-[.3em] text-gedaempft"
        >
          ···
        </td>
      </tr>
    );
  }
  const mein = meinTeam.includes(zeile.id);
  const zelle = `h-[34px] border-t border-rand py-1.5 ${mein ? "bg-akzent/8" : ""}`;
  return (
    <tr data-mein-team={mein || undefined}>
      <td
        className={`${zelle} w-[26px] text-right text-gedaempft ${
          mein
            ? "rounded-l-lg pl-2 shadow-[inset_3px_0_0_var(--color-akzent)]"
            : ""
        }`}
      >
        {zeile.platz}
      </td>
      <td className={`${zelle} pl-2`}>
        <Team team={{ ...zeile, tore: null }} mein={mein} />
      </td>
      <td className={`${zelle} w-[34px] text-right text-gedaempft`}>
        {zeile.spiele}
      </td>
      <td className={`${zelle} w-[34px] text-right text-gedaempft`}>
        {zeile.differenz > 0 ? `+${zeile.differenz}` : zeile.differenz}
      </td>
      <td
        className={`${zelle} w-[38px] text-right font-semibold ${
          mein ? "rounded-r-lg pr-2" : ""
        }`}
      >
        {zeile.punkte}
      </td>
    </tr>
  );
}

export function FussballAnsicht({ daten }: { daten: FussballDaten }) {
  const tage = daten.tage.length > 0 ? tageText(daten.tage) : "";
  const ueberschrift = [daten.titel, tage].filter(Boolean).join(" · ");
  return (
    <>
      <Abschnitt titel={ueberschrift || "Spieltag"}>
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
      <Abschnitt titel="Tabelle">
        {daten.tabelle === null ? (
          <p className="text-gedaempft">Tabelle gerade nicht erreichbar</p>
        ) : (
          <table className="w-full border-collapse text-sm tabular-nums">
            <thead>
              <tr className="text-[11px] font-semibold tracking-[0.08em] text-gedaempft uppercase">
                <th className="pb-1 text-right font-semibold">#</th>
                <th className="pb-1 pl-2 text-left font-semibold">Team</th>
                <th className="pb-1 text-right font-semibold">Sp</th>
                <th className="pb-1 text-right font-semibold">+/−</th>
                <th className="pb-1 text-right font-semibold">Pkt</th>
              </tr>
            </thead>
            <tbody>
              {daten.tabelle.map((zeile, index) => (
                <TabellenZeilen
                  key={zeile?.id ?? `luecke-${index}`}
                  zeile={zeile}
                  meinTeam={daten.meinTeam}
                />
              ))}
            </tbody>
          </table>
        )}
      </Abschnitt>
    </>
  );
}
