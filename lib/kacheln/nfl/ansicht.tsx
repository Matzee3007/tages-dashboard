import type { Zone } from "@/lib/einstellungen";
import {
  Legende,
  MEIN_TEAM_GRUND,
  nachTagen,
  PartieZeile,
  Team,
  zoneVon,
} from "@/lib/kacheln/fussball/ansicht";
import type { TeamStand } from "@/lib/kacheln/fussball/typen";
import { bilanz } from "@/lib/kacheln/nfl/kurz";
import type { NflDaten, NflZeile } from "@/lib/kacheln/nfl/typen";
import { datum, tageText } from "@/lib/zeit";

// Ist Mein Team spielfrei, steht die Zeile oben und orange, sonst klein am Ende (Mock NFL).
function Spielfrei({ teams, mein }: { teams: TeamStand[]; mein: boolean }) {
  if (teams.length === 0) return null;
  return (
    <p
      data-mein-team={mein || undefined}
      className={`border-t border-rand px-3.5 py-2 text-[12.5px] ${
        mein ? `${MEIN_TEAM_GRUND} font-[650] text-akzent` : "text-gedaempft"
      }`}
    >
      Spielfrei: {teams.map((team) => team.name).join(", ")}
    </p>
  );
}

// Die Linie steht nur in der Conference nach Seed 7: Bis dorthin reicht es für die Playoffs (Plan NFL, Mock).
const PLAYOFF_SEEDS = 7;

function Tabelle({
  name,
  zeilen,
  meinTeam,
  zonen,
  mitLinie,
}: {
  name: string;
  zeilen: (NflZeile | null)[];
  meinTeam: string[];
  zonen: Zone[];
  mitLinie: boolean;
}) {
  return (
    <table aria-label={name} className="w-full border-collapse text-[13.5px]">
      <caption className="mb-1 text-left text-[12.5px] font-[650] text-gedaempft">
        {name}
      </caption>
      <thead>
        <tr className="text-[11.5px] text-rauch">
          <th className="pb-1 text-left font-medium">Seed</th>
          <th className="pb-1 text-left font-medium">Team</th>
          <th className="pb-1 text-right font-medium">W–L</th>
        </tr>
      </thead>
      <tbody>
        {zeilen.map((zeile, index) => {
          if (!zeile) {
            return (
              <tr key={`luecke-${index}`}>
                <td
                  colSpan={3}
                  className="h-4 text-center text-xs tracking-[.3em] text-rauch"
                >
                  ···
                </td>
              </tr>
            );
          }
          const mein = meinTeam.includes(zeile.id);
          const zone = zoneVon(zonen, zeile.seed);
          const naechste = zeilen[index + 1];
          const linie =
            mitLinie &&
            !!naechste &&
            zeile.seed <= PLAYOFF_SEEDS &&
            naechste.seed > PLAYOFF_SEEDS;
          const zelle = `h-8 py-[3px] ${mein ? MEIN_TEAM_GRUND : ""} ${
            linie ? "border-b border-b-grenze" : ""
          }`;
          return (
            <tr
              key={zeile.id}
              data-seed={zeile.seed}
              data-mein-team={mein || undefined}
              data-linie={linie || undefined}
            >
              <td
                className={`${zelle} w-12 text-[12.5px] font-semibold text-gedaempft`}
              >
                <span className="flex items-center gap-[9px]">
                  <span
                    aria-hidden
                    className="h-[18px] w-[3px] rounded-[2px]"
                    style={{ background: zone?.farbe ?? "transparent" }}
                  />
                  {zeile.seed}
                </span>
              </td>
              <td className={`${zelle} max-w-0`}>
                <Team team={{ ...zeile, tore: null }} mein={mein} />
              </td>
              <td className={`${zelle} w-14 pr-1 text-right font-[720]`}>
                {bilanz(zeile)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function NflAnsicht({
  daten,
  ebene = 4,
}: {
  daten: NflDaten;
  ebene?: 3 | 4;
}) {
  const Ueberschrift = ebene === 3 ? "h3" : "h4";
  const tage = daten.tage.length > 0 ? ` · ${tageText(daten.tage)}` : "";
  const meinSpielfrei = daten.spielfrei.some((team) =>
    daten.meinTeam.includes(team.id),
  );
  const spielfrei = <Spielfrei teams={daten.spielfrei} mein={meinSpielfrei} />;
  return (
    <>
      <div>
        <Ueberschrift className="-mt-2.5 pr-3.5 pb-2.5 pl-[62px] text-[12.5px] text-gedaempft">
          {daten.titel}
          {tage}
        </Ueberschrift>
        {meinSpielfrei && spielfrei}
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
        {!meinSpielfrei && spielfrei}
      </div>
      <div className="flex flex-col gap-3 border-t border-rand px-3.5 pt-3 pb-3.5">
        <Ueberschrift className="text-[13.5px] font-[720]">
          Tabelle
        </Ueberschrift>
        {daten.division === null || daten.conference === null ? (
          <p className="text-[13.5px] text-gedaempft">
            Tabelle gerade nicht erreichbar
          </p>
        ) : (
          <>
            <Tabelle
              name={daten.divisionName}
              zeilen={daten.division}
              meinTeam={daten.meinTeam}
              zonen={daten.zonen}
              mitLinie={false}
            />
            <Tabelle
              name={daten.divisionName.split(" ")[0]}
              zeilen={daten.conference}
              meinTeam={daten.meinTeam}
              zonen={daten.zonen}
              mitLinie
            />
            <Legende zonen={daten.zonen} />
          </>
        )}
      </div>
    </>
  );
}
