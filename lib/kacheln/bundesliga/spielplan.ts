// Spielplan der Saison von OpenLigaDB, nur für die Nummer des Spieltags (ADR 0009).

type OpenLigaPartie = {
  matchDateTime?: string;
  group?: { groupOrderID?: number };
};

// Tag "YYYY-MM-DD" (deutsche Zeit) → höchste Nummer eines Spieltags an diesem Tag.
export function leseSpielplan(json: unknown): Map<string, number> {
  if (!Array.isArray(json)) {
    throw new Error("Unerwartete Antwort von OpenLigaDB");
  }
  const spielplan = new Map<string, number>();
  for (const partie of json as OpenLigaPartie[]) {
    const tag = partie.matchDateTime?.slice(0, 10);
    const nummer = partie.group?.groupOrderID;
    if (!tag || typeof nummer !== "number") continue;
    spielplan.set(tag, Math.max(nummer, spielplan.get(tag) ?? 0));
  }
  return spielplan;
}
