// Liest die inoffizielle Schnittstelle von ESPN (ADR 0009). Felder laut Antworten vom 2026-11-08.

function falscheForm(): never {
  throw new Error("Unerwartete Antwort von ESPN");
}

// Tage mit Spielen, z. B. "2026-11-06T08:00Z" → "2026-11-06".
export function leseKalender(json: unknown): string[] {
  const kalender = (json as { leagues?: { calendar?: unknown }[] })
    ?.leagues?.[0]?.calendar;
  if (!Array.isArray(kalender)) falscheForm();
  return kalender
    .filter((eintrag): eintrag is string => typeof eintrag === "string")
    .map((eintrag) => eintrag.slice(0, 10))
    .sort();
}
