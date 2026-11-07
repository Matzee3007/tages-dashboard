import { Abschnitt } from "@/lib/kacheln/kachel";
import type { AbsenderStand } from "@/lib/kacheln/ki-news/laden";
import type { Meldung } from "@/lib/kacheln/ki-news/feed";
import type { KachelDaten } from "@/lib/kacheln/typen";
import { alterText, istFrisch } from "@/lib/zeit";

function MeldungsZeile({ meldung }: { meldung: Meldung }) {
  // Ein Zeitpunkt für Punkt und Text, damit beide an der Grenze von 24 Std. zusammenpassen.
  const jetzt = new Date();
  return (
    <a
      href={meldung.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-11 items-center gap-3 border-t border-rand py-1.5 first:border-t-0"
    >
      {/* Ein durchsichtiger Punkt hält die Titel bündig. */}
      {istFrisch(meldung.zeit, jetzt, meldung.nurDatum) ? (
        <span
          role="img"
          aria-label="neu"
          className="size-2 shrink-0 rounded-full bg-akzent"
        />
      ) : (
        <span aria-hidden className="size-2 shrink-0" />
      )}
      <span className="min-w-0 flex-1 text-[15px] font-medium underline-offset-3 group-hover:underline">
        {meldung.titel}
      </span>
      <span className="shrink-0 text-[13px] whitespace-nowrap text-gedaempft">
        {alterText(meldung.zeit, jetzt, meldung.nurDatum)}
      </span>
    </a>
  );
}

function RuhigeZeile({ absender }: { absender: AbsenderStand }) {
  return (
    <div className="flex justify-between gap-3 py-[5px] text-sm text-gedaempft">
      <span className="text-xs font-semibold tracking-[0.08em] uppercase">
        {absender.name}
      </span>
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

export function KiNewsAnsicht({ daten }: { daten: KachelDaten }) {
  const aktiv = daten.absender.filter((a) => a.meldungen.length > 0);
  const ruhig = daten.absender.filter((a) => a.meldungen.length === 0);

  return (
    <>
      {aktiv.map((absender) => (
        <Abschnitt key={absender.name} titel={absender.name}>
          <div className="flex flex-col">
            {absender.meldungen.map((meldung) => (
              <MeldungsZeile key={meldung.link} meldung={meldung} />
            ))}
          </div>
        </Abschnitt>
      ))}
      {ruhig.length > 0 && (
        <div className="flex flex-col border-t border-rand pt-2">
          {ruhig.map((absender) => (
            <RuhigeZeile key={absender.name} absender={absender} />
          ))}
        </div>
      )}
    </>
  );
}
