---
titel: Glossar
status: aktiv
erstellt: 2026-10-25
tags: [glossar, fachbegriffe]
---

# Glossar

Das Tages-Dashboard bündelt für genau einen Nutzer, was heute wichtig ist: Sport, Schritte und KI-News.
Gehört zu [[projects/tages-dashboard/docs/Projektvision|Projektvision]]. Technische Abkürzungen stehen in
[[docs/Abkürzungen|Abkürzungen]].

## Begriffe

**Kachel**:
Ein eigenständiger Bereich des Dashboards mit einer Art von Datenquelle, z. B. Bundesliga, Formel 1 oder KI-News
(alle RSS-Feeds zusammen).
_Nicht verwenden_: Widget, Modul, Karte

**Abschnitt**:
Ein Teilbereich innerhalb einer Kachel, z. B. Spieltag und Tabelle einer Sport-Kachel oder ein Absender in der
KI-News-Kachel.
_Nicht verwenden_: kleine Kachel, Unterkachel, Untereinheit

**Gruppe**:
Mehrere Kacheln, die sichtbar unter einer gemeinsamen Überschrift stehen, z. B. die Gruppe Sport mit Bundesliga, Premier League und
Champions League. Jede Kachel darin bleibt eigenständig. Die KI-News stehen ohne Gruppe.
_Nicht verwenden_: große Kachel, Bereich, Kategorie

**Reiter**:
Ein Bereich der Seite, den man oben (Mac, iPad) oder in der Leiste unten (iPhone) wählt: „Heute“ und je Gruppe einer, eine Kachel ohne
Gruppe bekommt einen eigenen (z. B. „Sport“, „KI-News“). [[projects/tages-dashboard/docs/adr/0014-reiter-mit-uebersicht|ADR 0014]].
_Nicht verwenden_: Tab, Seite

**Übersicht**:
Der Reiter „Heute“: das Wichtigste aller Kacheln, also laufende Partien, Mein Team und neue KI-News. Ein Tipp führt zur vollen Kachel.
_Nicht verwenden_: Startseite, Dashboard

## Sport

**Wettbewerb**:
Eine Liga, ein Turnier oder eine Rennserie, die als eigene Kachel erscheint: Bundesliga, Premier League,
Champions League, NFL, Formel 1.
_Nicht verwenden_: Liga (für alle), Turnier, Sportart

**Mein Team**:
Die Teams, denen ich in einem Wettbewerb folge, meist eins (FC Bayern, Arsenal, Seattle Seahawks), in der Champions
League zwei (FC Bayern und Arsenal). Die Formel 1 hat vorerst keins. Eigene Team-Kacheln gibt es nicht.
_Nicht verwenden_: Lieblingsverein, Favorit

**Spieltag**:
Die aktuelle Runde eines Wettbewerbs mit allen Partien, auch wenn sie nicht heute stattfinden. In der NFL ist das
die Woche, in der Formel 1 das Rennwochenende. Ein Spieltag bleibt bis Mitternacht (deutsche Zeit) des Tages nach seinem letzten
Spiel aktuell, danach ist es der nächste.
_Nicht verwenden_: Matchday, Runde, heute

**Seed**:
Der Platz eines NFL-Teams in seiner Conference (1–16) für die Playoffs. Seeds 1–4 sind die Division-Sieger, 5–7 die Wildcards.
_Nicht verwenden_: Rang, Setzplatz

**Spielfrei**:
Ein NFL-Team hat in dieser Woche keine Partie (englisch Bye). Jedes Team hat eine spielfreie Woche je Saison.
_Nicht verwenden_: Bye-Week, Pause

**Partie**:
Ein einzelnes Spiel zweier Teams in einem Spieltag.
_Nicht verwenden_: Match, Begegnung

**Liveticker**:
Die Einträge Minute für Minute, die ESPN zu einer Partie liefert (englisch).
_Nicht verwenden_: Kommentar, Commentary

**Spielbericht**:
Ein kurzer, KI-generierter Text zu einer beendeten Partie, erzeugt aus ihrem Liveticker. Eine Partie hat höchstens einen.
_Nicht verwenden_: Zusammenfassung (gehört zu einer Meldung), Matchreport, Spielzusammenfassung

**Ligaphase**:
Der erste Teil der Champions League bis Ende Januar: 36 Teams in einer gemeinsamen Tabelle, 8 Spieltage. Danach folgt die K.-o.-Phase
mit Hin- und Rückspiel und ohne Tabelle.
_Nicht verwenden_: Gruppenphase, Vorrunde

**Nachholspiel**:
Eine Partie, die nach ihrem Spieltag gespielt wird, weil sie verlegt wurde. Liegen alle Partien eines Spieltags in einem
früheren Spieltag als dem zuletzt gespielten, heißt er Nachholspiel statt `5. Spieltag`.
_Nicht verwenden_: verlegtes Spiel, Nachholtermin

## KI-News

**Absender**:
Eine Person, Organisation oder ein Produkt, deren Meldungen einen eigenen Abschnitt bekommen, z. B. Anthropic, Andrej
Karpathy oder Claude Updates. Ein Absender kann mehrere Kanäle haben.
_Nicht verwenden_: Quelle, Feed

**Kanal**:
Ein Ort, an dem ein Absender regelmäßig veröffentlicht, z. B. ein Feed oder eine News-Seite.
_Nicht verwenden_: Quelle, Plattform

**Meldung**:
Ein einzelner Eintrag eines Absenders mit Titel, Alter und Link zum Artikel.
_Nicht verwenden_: Post, News (für den einzelnen Eintrag)

**Artikel**:
Der verlinkte Originaltext einer Meldung auf der Website des Absenders. Ein Video hat keinen Artikel.
_Nicht verwenden_: Meldung (für den Originaltext), Beitrag

**Zusammenfassung**:
Ein kurzer, KI-generierter Text zu einer Meldung, erzeugt aus ihrem Artikel. Eine Meldung hat höchstens eine.
_Nicht verwenden_: Summary, Überblick, Anreißer

## Schritte

**Tagesziel**:
Die Schrittzahl, die ich an einem Tag erreichen will; der Tag endet um Mitternacht deutscher Zeit.
_Nicht verwenden_: Ziel, Schrittziel
