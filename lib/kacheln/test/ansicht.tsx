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
      <Abschnitt titel="Einstellungen">
        <div className="flex justify-between gap-3">
          <span>Fehler auslösen</span>
          <span className="text-gedaempft">aus</span>
        </div>
      </Abschnitt>
    </>
  );
}
