import { useEffect, useRef } from "react";

const TAKT_MS = 60_000;

// Ruft beim Start und jede Minute ab, aber nur solange die Seite sichtbar ist.
export function useAktualisierung(abrufen: () => void): void {
  const aktuell = useRef(abrufen);
  useEffect(() => {
    aktuell.current = abrufen;
  }, [abrufen]);

  useEffect(() => {
    let letzterAbruf = Date.now();
    const rufeAb = () => {
      letzterAbruf = Date.now();
      aktuell.current();
    };

    // Der Takt prüft nicht die vergangene Zeit: Sonst entfiele durch kleine Abweichungen jede zweite Abfrage.
    const beimTakt = () => {
      if (document.visibilityState === "visible") rufeAb();
    };
    const beimWechsel = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - letzterAbruf >= TAKT_MS
      ) {
        rufeAb();
      }
    };

    rufeAb();
    const takt = setInterval(beimTakt, TAKT_MS);
    document.addEventListener("visibilitychange", beimWechsel);
    return () => {
      clearInterval(takt);
      document.removeEventListener("visibilitychange", beimWechsel);
    };
  }, []);
}
