import { Abschnitt } from "@/lib/kacheln/kachel";
import type { KachelDaten } from "@/lib/kacheln/typen";

export function TestAnsicht({ daten }: { daten: KachelDaten }) {
  return (
    <>
      <Abschnitt titel="Server-Uhrzeit">
        <span className="font-titel text-[56px] leading-none font-bold">
          {daten.uhrzeit}
        </span>
      </Abschnitt>
      <Abschnitt titel="Anzeige">
        <div className="flex justify-between gap-3">
          <span>Zeitzone</span>
          <span className="text-gedaempft">Europe/Berlin</span>
        </div>
      </Abschnitt>
    </>
  );
}
