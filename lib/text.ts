// Grobe Prüfungen von deutschem Text, für Evaluation und Spielberichte (ADR 0010, 0013).

const SEGMENTER = new Intl.Segmenter("de", { granularity: "sentence" });
// Der Segmenter sieht ein Satzende nach jedem Punkt vor einem Großbuchstaben, auch nach „z.“, „15.“ oder „bzw.“.
// Endet ein Stück mit einem einzelnen Buchstaben, einer Zahl oder einer Abkürzung, gehört das nächste noch dazu.
// (?<!\p{L}) statt \b: \b kennt nur ASCII, „Freistoß.“ galt sonst als einzelner Buchstabe.
const KEIN_SATZENDE =
  /((?<!\p{L})\p{L}|\d|(?<!\p{L})(bzw|ca|nr|dr|vgl|usw|etc))\.$/iu;

export function zaehleSaetze(text: string): number {
  let saetze = 0;
  let offen = false;
  for (const { segment } of SEGMENTER.segment(text)) {
    const stueck = segment.trim();
    if (!stueck) continue;
    if (!offen) saetze++;
    offen = KEIN_SATZENDE.test(stueck);
  }
  return saetze;
}

const DEUTSCHE_WOERTER = new Set(
  "der die das und ist nicht mit ein eine einen einem für auf sich den dem des von zu im als auch wird werden sind nach bei über".split(
    " ",
  ),
);
// Ohne „in“ und „a“: Die gibt es auch im Deutschen (Review von PR #64).
const ENGLISCHE_WOERTER = new Set(
  "the and is of to with for that its on are it by this from has".split(" "),
);

// Grob über häufige kleine Wörter: Englische Fachbegriffe in einem deutschen Satz kippen das Ergebnis nicht.
// Ohne Treffer auf beiden Seiten entscheiden Umlaute und ß.
export function istDeutsch(text: string): boolean {
  const woerter = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  const deutsch = woerter.filter((wort) => DEUTSCHE_WOERTER.has(wort)).length;
  const englisch = woerter.filter((wort) => ENGLISCHE_WOERTER.has(wort)).length;
  if (deutsch === 0 && englisch === 0) return /[äöüß]/i.test(text);
  return deutsch > englisch;
}
