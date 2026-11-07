---
titel: Lernjournal Phase 2 - Feeds lesen
status: abgeschlossen
phase: 2
erstellt: 2026-11-04
tags: [lernjournal, phase-2, rss, fast-xml-parser, next-js, docker]
---

# Lernjournal Phase 2: Feeds lesen

Fortsetzung von [[projects/tages-dashboard/docs/journal/Lernjournal Phase 1 - Dependabot und Mac-App|Lernjournal Phase 1 - Dependabot und Mac-App]].
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]].

## Erledigt

- [x] Docker bewertet: für den Betrieb nicht nötig, für die lokale Supabase ab Phase 4 in den [[projects/tages-dashboard/docs/Tools für später|Tools für später]] vorgemerkt
- [x] `/grill-with-docs` für Phase 2 in vier Runden (F1 bis F20), Ergebnis in der Projektvision, „Kanal“ neu im [[projects/tages-dashboard/docs/Glossar|Glossar]] (PR #29)
- [x] Folge-PR zum Hinweis auf `/goal` im Skill `plan-schreiben` im Ecosystem (dortiger PR #144), mit `/code-review` und 8 behobenen Funden
- [x] Fahrplan-Schritt 1 „Feeds lesen“ nach [[projects/tages-dashboard/docs/plaene/2026-11-04-feeds-lesen|Plan]] (PR #30): Parser, Abruf, Zusammenfassen je Absender, Zeitlimit je Kachel
- [x] [[projects/tages-dashboard/docs/adr/0005-feeds-im-fetch-speicher|ADR 0005]] und Tool-Notiz [[projects/tages-dashboard/docs/tools/fast-xml-parser|fast-xml-parser]]
- [ ] Phase 2: Schritte 2 bis 4 stehen noch aus. Die Feeds sind im Dashboard noch nicht sichtbar.

## Befehle: Feeds prüfen

```bash
/usr/bin/curl -sL --compressed -m 20 -A 'Tages-Dashboard' -o datei.xml -w '%{http_code} %{content_type}\n' '<url>'
/usr/bin/curl -sL --compressed -m 20 -A 'Tages-Dashboard' -o /dev/null -D - '<url>' | grep -iE '^(date|age):'
```

- Erster Befehl: lädt einen Feed und zeigt Status und Inhaltsart. So ließ sich jeder mögliche Kanal vor der Entscheidung prüfen. `--compressed` entpackt die Antwort,
  ohne das Flag kam der DeepMind-Feed als unlesbare gzip-Daten an.
- Zweiter Befehl: zeigt nur die Kopfzeilen `Date` und `Age`. Das war die Grundlage für die Prüfung auf das Alter der Antwort.

## Befehle: Umsetzung

```bash
npm install --save-exact fast-xml-parser@5.12.0
npx vitest run __tests__/ki-news-feed.test.ts
npx vitest run __tests__/live.tmp.test.ts --disable-console-intercept
npx next build
npx next start -p 4598
gh pr checks 30 --watch --interval 10
```

- `npm install --save-exact …`: installiert die neue Abhängigkeit mit genau dieser Version, ohne `^` in der `package.json`.
- `npx vitest run <datei>`: führt nur eine Testdatei aus, passend zur Rot-Grün-Schleife.
- `--disable-console-intercept`: zeigt `console.log` ungefiltert, hier für die einmalige Probe gegen die echten Feeds. Die Datei wurde danach gelöscht.
- `npx next build` und `npx next start`: bauen und starten die App wie im Betrieb. Nur so ließ sich der Zwischenspeicher echt testen.
- `gh pr checks <nr> --watch`: wartet, bis die CI eines PRs fertig ist.

## Neu gelernt

### Docker braucht einen Anlass

Vercel betreibt die App ohne Container, die Mac-App wird direkt auf macOS gebaut, und `npm ci` hält die Umgebung gleich. Docker würde hier kein Problem lösen.
Sinnvoll wird es erst für die lokale Supabase, die die Supabase-CLI über Docker startet.

### Kanäle und ihre Zugänge

Anthropic hat keinen eigenen News-Feed, viele andere schon. Bluesky und Substack sind bei Karpathy und Pocock praktisch still oder leer. X geht nur über die bezahlte API, die heute pro Post
abrechnet (0,005 $) statt wie früher ab 200 $ im Monat. Trotz geschätzter 3 $ im Monat fiel X raus, weil das Dashboard nichts kosten soll.

### Stale-while-revalidate

Ein Zwischenspeicher liefert sofort den alten Stand und frischt ihn im Hintergrund auf. Das ist schnell, verbirgt aber Ausfälle: Bei Next.js läuft der Abruf im Hintergrund zudem ohne
unser Zeitlimit, und ein Fehler steht nur im Log. Tests, die `fetch` ersetzen, können das nicht zeigen, es fiel erst beim Lesen des Quellcodes von Next.js auf.

### `use cache` gegen `fetch`-Speicher

Mit `cacheComponents` empfiehlt die Doku `use cache`. Der liegt aber im Arbeitsspeicher und geht auf Vercel oft verloren. Wir bleiben deshalb bei `next.revalidate` und halten die
Abweichung in ADR 0005 fest.

### Date und Age

Die aufgehobene `Date`-Zeile zeigt, wie alt eine gespeicherte Antwort ist. `Age` ist dafür unbrauchbar: Bear meldete 16413 Sekunden bei aktuellem `Date`, YouTube dagegen ein um rund 14 Minuten
zurückliegendes `Date`.

### Mutationstest

Man baut absichtlich einen Fehler in den Code ein und schaut, ob ein Test rot wird. `toContain("a")` war immer wahr, weil schon der feste Logtext ein „a“ enthält. Mit einer eindeutigen URL und
einer Mutation ließ sich zeigen, dass der Test jetzt etwas prüft.

### Mehrfach prüfen lohnt sich

`plan-pruefer` fand schwache Tests, `/code-review` danach einen Denkfehler im Plan selbst. Beide suchen Verschiedenes: Der eine vergleicht mit dem Plan, der andere stellt ihn infrage.

## Fehler und Lösungen

### `(eval):1: ===== not found`

- **Wo:** beim Lesen der Doku, `echo =====` als Trenner im Befehl
- **Ursache:** zsh deutet `=` am Wortanfang als Befehlssuche. Die Regel steht schon in der globalen `CLAUDE.md`, sie wurde nicht befolgt.
- **Lösung:** Text in `'…'` setzen, hier `echo '--- tests'`
- **Prüfen:** Der Befehl lief danach ohne Fehler durch.

### `Status 502` von `hnrss.org`

- **Wo:** Probe des Agents `plan-pruefer` gegen die echten Feeds
- **Ursache:** Ausfall beim Anbieter (Seite „Bad Gateway“ von nginx), unabhängig vom `User-Agent`
- **Lösung:** keine nötig, der Code reagierte wie geplant, die anderen 8 Absender liefen weiter
- **Prüfen:** Ein erneuter Abruf lieferte zweimal Status 200.

## Aus dem Chat

-

## Offene Fragen

- Hält der Zwischenspeicher auch auf Vercel, und antworten alle Anbieter den Servern von Vercel?
- Wie teuer ist es auf Vercel, jede Minute rund 2,4 MB XML neu zu lesen?
- Gibt es `/goal` wirklich? Die Eingabe kam mit einem Leerzeichen davor und wurde als normaler Text behandelt, der Befehl ist also weiter ungetestet.

## Nächste Schritte

1. Fahrplan-Schritt 2: fremde Links in der Mac-App im Standardbrowser öffnen.
2. Fahrplan-Schritt 3: KI-News-Kachel, mit den offenen Punkten aus dem Review von PR #30.
3. Fahrplan-Schritt 4: Seiten ohne Feed auslesen.
