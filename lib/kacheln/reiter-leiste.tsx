// Reiter: auf dem iPhone als Leiste unten, ab 600 px oben unter dem Kopf (ADR 0014, Mock Variante D).
// abzeichen: "live" zeigt einen orangefarbenen Punkt, eine Zahl die neuen Meldungen.
export function ReiterLeiste({
  reiter,
  aktiv,
  waehle,
  abzeichen,
}: {
  reiter: string[];
  aktiv: string;
  waehle: (name: string) => void;
  abzeichen: Record<string, "live" | number>;
}) {
  return (
    <nav
      aria-label="Bereiche"
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-rand bg-grund/95 px-1.5 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] backdrop-blur min-[600px]:static min-[600px]:self-start min-[600px]:gap-1 min-[600px]:rounded-[14px] min-[600px]:border-0 min-[600px]:bg-karte min-[600px]:p-1 min-[600px]:backdrop-blur-none"
    >
      {reiter.map((name) => {
        const an = name === aktiv;
        const zeichen = abzeichen[name];
        return (
          <button
            key={name}
            type="button"
            onClick={() => waehle(name)}
            aria-current={an ? "page" : undefined}
            className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-4 text-[14.5px] font-semibold min-[600px]:flex-none ${
              an ? "bg-flaeche text-text" : "text-gedaempft hover:text-text"
            }`}
          >
            {name}
            {zeichen === "live" && (
              <span
                aria-label="live"
                className="size-[7px] rounded-full bg-akzent"
              />
            )}
            {typeof zeichen === "number" && zeichen > 0 && (
              <span
                aria-label={`${zeichen} neu`}
                className="rounded-full bg-akzent px-1.5 text-[11.5px] leading-[18px] font-bold text-grund"
              >
                {zeichen}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
