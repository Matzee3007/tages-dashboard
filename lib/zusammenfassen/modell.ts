const MAX_ZUSAMMENFASSUNG_ZEICHEN = 600;

// Die Antwort des Modells ist fremder Text: Sie gilt erst nach dieser Prüfung als Zusammenfassung (ADR 0010).
export function pruefeAntwort(inhalt: string): string | null {
  let daten: unknown;
  try {
    daten = JSON.parse(inhalt);
  } catch {
    return null;
  }
  const text =
    typeof daten === "object" && daten !== null && "zusammenfassung" in daten
      ? daten.zusammenfassung
      : null;
  if (typeof text !== "string") return null;
  const getrimmt = text.trim();
  return getrimmt && getrimmt.length <= MAX_ZUSAMMENFASSUNG_ZEICHEN
    ? getrimmt
    : null;
}
