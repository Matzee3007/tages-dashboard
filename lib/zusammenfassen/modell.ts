// Die Antwort des Modells ist fremder Text: Sie gilt erst nach dieser Prüfung als Zusammenfassung (ADR 0010).
export function pruefeAntwort(inhalt: string): string | null {
  return JSON.parse(inhalt).zusammenfassung;
}
