import type { SeitenArt } from "@/lib/kacheln/ki-news/seiten";

// Hausfarbe einer Quelle als Akzent (Name, Grenzlinie). marke: Farbe des kleinen Quadrats, wenn sie anders ist, z. B. weil die
// Hausfarbe nahe an Orange liegt, das Mein Team, Live und „neu“ gehört (Mock F vom 2026-11-16).
export type Aussehen = { farbe: string; marke?: string };

// Ein Bereich der Tabelle mit derselben Bedeutung (z. B. Plätze 1–4: Champions League). Zwischen zwei Zonen steht eine Linie.
// Grundverteilung der Saison, von Hand geprüft (Projektvision „Plätze der Linien“). Farben und Namen aus Mock G vom 2026-11-17.
export type Zone = { von: number; bis: number; name: string; farbe: string };

const CHAMPIONS_LEAGUE: Omit<Zone, "von" | "bis"> = {
  name: "Champions League",
  farbe: "#4C8DF6",
};
const EUROPA_LEAGUE = { name: "Europa League", farbe: "#22B8CF" };
const CONFERENCE_LEAGUE = { name: "Conference League", farbe: "#4CC38A" };
const ABSTIEG = { name: "Abstieg", farbe: "#E5484D" };

// gruppe: Kacheln mit derselben Gruppe stehen zusammen unter ihrer Überschrift (Glossar: Gruppe).
type KachelBasis = {
  id: string;
  titel: string;
  aussehen: Aussehen;
  gruppe?: string;
};

export type KiNewsEinstellung = KachelBasis & { art: "ki-news" };

// Ein Team mit id bei ESPN, id bei football-data.org (falls die Liga sie braucht) und deutschem Kurznamen.
export type Team = { espn: string; footballData?: number; name: string };

// Kommt die Tabelle von football-data.org, braucht jedes Team dessen id, sonst erkennt sie Mein Team nicht.
export type FdTeam = Team & { footballData: number };

// Ein Fußball-Wettbewerb: Partien immer von ESPN, Kalender (Tage mit Spielen), Spielplan (Nummer des Spieltags) und
// Tabelle je nach Quelle (ADR 0011). Der Kalender von ESPN kennt bei der Champions League keine Tage, dort kommen sie
// aus dem Spielplan. meinTeam: ids der Teams bei ESPN (Glossar: Mein Team).
export type FussballEinstellung = KachelBasis & {
  art: "fussball";
  espn: "ger.1" | "eng.1" | "uefa.champions";
  kalender: { art: "espn" } | { art: "spielplan" };
  spielplan:
    | { art: "openligadb"; liga: "bl1" }
    | { art: "football-data"; wettbewerb: "PL" | "CL" };
  meinTeam: string[];
  zonen: Zone[];
} & (
    | { tabelle: { art: "espn" }; teams: Team[] }
    | {
        tabelle: { art: "football-data"; wettbewerb: "PL" | "CL" };
        teams: FdTeam[];
      }
  );

export type KachelEinstellung = KiNewsEinstellung | FussballEinstellung;

// Teams der Bundesliga mit deutschem Kurznamen nach der id von ESPN, Saison 2026/27 (Projektvision, Phase 3).
export const TEAMS_BUNDESLIGA: Team[] = [
  { espn: "132", name: "Bayern" },
  { espn: "124", name: "Dortmund" },
  { espn: "11420", name: "Leipzig" },
  { espn: "126", name: "Freiburg" },
  { espn: "131", name: "Leverkusen" },
  { espn: "137", name: "Bremen" },
  { espn: "10388", name: "Elversberg" },
  { espn: "134", name: "Stuttgart" },
  { espn: "125", name: "Frankfurt" },
  { espn: "127", name: "HSV" },
  { espn: "2950", name: "Mainz" },
  { espn: "3307", name: "Paderborn" },
  { espn: "3841", name: "Augsburg" },
  { espn: "7911", name: "Hoffenheim" },
  { espn: "122", name: "Köln" },
  { espn: "598", name: "Union" },
  { espn: "133", name: "Schalke" },
  { espn: "268", name: "Gladbach" },
];

// Teams der Premier League: id bei ESPN, id bei football-data.org, Kurzname. Saison 2026/27, abgeglichen an beiden Tabellen
// vom 2026-11-16 (ADR 0011).
export const TEAMS_PREMIER_LEAGUE: FdTeam[] = [
  { espn: "359", footballData: 57, name: "Arsenal" },
  { espn: "331", footballData: 397, name: "Brighton" },
  { espn: "382", footballData: 65, name: "Man City" },
  { espn: "364", footballData: 64, name: "Liverpool" },
  { espn: "363", footballData: 61, name: "Chelsea" },
  { espn: "368", footballData: 62, name: "Everton" },
  { espn: "349", footballData: 1044, name: "Bournemouth" },
  { espn: "337", footballData: 402, name: "Brentford" },
  { espn: "357", footballData: 341, name: "Leeds" },
  { espn: "362", footballData: 58, name: "Aston Villa" },
  { espn: "367", footballData: 73, name: "Tottenham" },
  { espn: "361", footballData: 67, name: "Newcastle" },
  { espn: "306", footballData: 322, name: "Hull" },
  { espn: "373", footballData: 349, name: "Ipswich" },
  { espn: "370", footballData: 63, name: "Fulham" },
  { espn: "393", footballData: 351, name: "Nottingham" },
  { espn: "388", footballData: 1076, name: "Coventry" },
  { espn: "360", footballData: 66, name: "Man United" },
  { espn: "366", footballData: 71, name: "Sunderland" },
  { espn: "384", footballData: 354, name: "Crystal Palace" },
];

// Teams der Ligaphase der Champions League: id bei ESPN, id bei football-data.org, Kurzname wie in Bundesliga und Premier
// League, sonst der von ESPN. Saison 2026/27, abgeglichen an den Partien von ESPN und der Tabelle von football-data.org vom
// 2026-11-16 (ADR 0011).
export const TEAMS_CHAMPIONS_LEAGUE: FdTeam[] = [
  { espn: "887", footballData: 1899, name: "AEK Athens" },
  { espn: "104", footballData: 100, name: "AS Roma" },
  { espn: "359", footballData: 57, name: "Arsenal" },
  { espn: "362", footballData: 58, name: "Aston Villa" },
  { espn: "1068", footballData: 78, name: "Atlético" },
  { espn: "83", footballData: 81, name: "Barcelona" },
  { espn: "132", footballData: 5, name: "Bayern" },
  { espn: "244", footballData: 90, name: "Betis" },
  { espn: "2980", footballData: 5721, name: "Bodo/Glimt" },
  { espn: "570", footballData: 851, name: "Club Brugge" },
  { espn: "2572", footballData: 7397, name: "Como" },
  { espn: "124", footballData: 4, name: "Dortmund" },
  { espn: "437", footballData: 503, name: "FC Porto" },
  { espn: "436", footballData: 613, name: "Fenerbahce" },
  { espn: "142", footballData: 675, name: "Feyenoord" },
  { espn: "432", footballData: 610, name: "Galatasaray" },
  { espn: "110", footballData: 108, name: "Inter Milan" },
  { espn: "4411", footballData: 2016, name: "LASK Linz" },
  { espn: "175", footballData: 546, name: "Lens" },
  { espn: "166", footballData: 521, name: "Lille" },
  { espn: "364", footballData: 64, name: "Liverpool" },
  { espn: "382", footballData: 65, name: "Man City" },
  { espn: "360", footballData: 66, name: "Man United" },
  { espn: "114", footballData: 113, name: "Napoli" },
  { espn: "160", footballData: 524, name: "PSG" },
  { espn: "148", footballData: 674, name: "PSV" },
  { espn: "11420", footballData: 721, name: "Leipzig" },
  { espn: "86", footballData: 86, name: "Real Madrid" },
  { espn: "521", footballData: 7509, name: "S Bratislava" },
  { espn: "21922", footballData: 10233, name: "Sabah" },
  { espn: "493", footballData: 1887, name: "Shakhtar" },
  { espn: "494", footballData: 930, name: "Slavia Prague" },
  { espn: "2250", footballData: 498, name: "Sporting" },
  { espn: "134", footballData: 10, name: "Stuttgart" },
  { espn: "510", footballData: 5720, name: "Viking FK" },
  { espn: "102", footballData: 94, name: "Villarreal" },
];

// Die Reihenfolge hier ist die Reihenfolge auf dem Bildschirm.
export const KACHELN: KachelEinstellung[] = [
  // 132 ist der FC Bayern bei ESPN.
  {
    id: "bundesliga",
    art: "fussball",
    titel: "Bundesliga",
    aussehen: { farbe: "#E3343F" },
    gruppe: "Sport",
    espn: "ger.1",
    kalender: { art: "espn" },
    spielplan: { art: "openligadb", liga: "bl1" },
    tabelle: { art: "espn" },
    teams: TEAMS_BUNDESLIGA,
    meinTeam: ["132"],
    zonen: [
      { von: 1, bis: 4, ...CHAMPIONS_LEAGUE },
      { von: 5, bis: 5, ...EUROPA_LEAGUE },
      { von: 6, bis: 6, ...CONFERENCE_LEAGUE },
      { von: 16, bis: 16, name: "Relegation", farbe: "#E2B93B" },
      { von: 17, bis: 18, ...ABSTIEG },
    ],
  },
  // 359 ist Arsenal bei ESPN.
  {
    id: "premier-league",
    art: "fussball",
    titel: "Premier League",
    aussehen: { farbe: "#B061D1" },
    gruppe: "Sport",
    espn: "eng.1",
    kalender: { art: "espn" },
    spielplan: { art: "football-data", wettbewerb: "PL" },
    tabelle: { art: "football-data", wettbewerb: "PL" },
    teams: TEAMS_PREMIER_LEAGUE,
    meinTeam: ["359"],
    zonen: [
      { von: 1, bis: 4, ...CHAMPIONS_LEAGUE },
      { von: 5, bis: 5, ...EUROPA_LEAGUE },
      { von: 6, bis: 6, ...CONFERENCE_LEAGUE },
      { von: 18, bis: 20, ...ABSTIEG },
    ],
  },
  // Ligaphase: Tage aus dem Spielplan, weil ESPN dort keine Tage im Kalender hat (ADR 0011). 132 Bayern, 359 Arsenal.
  {
    id: "champions-league",
    art: "fussball",
    titel: "Champions League",
    aussehen: { farbe: "#5B8DEF" },
    gruppe: "Sport",
    espn: "uefa.champions",
    kalender: { art: "spielplan" },
    spielplan: { art: "football-data", wettbewerb: "CL" },
    tabelle: { art: "football-data", wettbewerb: "CL" },
    teams: TEAMS_CHAMPIONS_LEAGUE,
    meinTeam: ["132", "359"],
    zonen: [
      { von: 1, bis: 8, name: "Achtelfinale", farbe: "#4CC38A" },
      { von: 9, bis: 24, name: "Play-offs", farbe: "#22B8CF" },
    ],
  },
  {
    id: "ki-news",
    art: "ki-news",
    titel: "KI-News",
    aussehen: { farbe: "#8E99A8" },
  },
];

export type SeitenEinstellung = { url: string; art: SeitenArt };

export type AbsenderEinstellung = {
  name: string;
  aussehen: Aussehen;
  feeds: string[];
  seiten?: SeitenEinstellung[];
};

export const ABSENDER: AbsenderEinstellung[] = [
  {
    name: "Anthropic",
    aussehen: { farbe: "#E8E6DC", marke: "#D97757" },
    feeds: [
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCrDwWp7EBBv4NwvScIpBDOA",
      "https://transformer-circuits.pub/feed.xml",
    ],
    seiten: [
      { url: "https://www.anthropic.com/news", art: "anthropic" },
      { url: "https://www.anthropic.com/research", art: "anthropic" },
      { url: "https://www.anthropic.com/engineering", art: "anthropic" },
      {
        url: "https://www.anthropic.com/research/team/frontier-red-team",
        art: "anthropic",
      },
      { url: "https://claude.com/resources/articles", art: "claude-artikel" },
    ],
  },
  {
    name: "Claude Updates",
    aussehen: { farbe: "#9AAE7E", marke: "#C15F3C" },
    feeds: ["https://platform.claude.com/docs/en/release-notes/feed.xml"],
    seiten: [
      {
        url: "https://support.claude.com/en/articles/12138966-release-notes",
        art: "versionshinweise",
      },
    ],
  },
  {
    name: "OpenAI",
    aussehen: { farbe: "#ECECEC" },
    feeds: ["https://openai.com/news/rss.xml"],
  },
  {
    name: "Google DeepMind",
    aussehen: { farbe: "#4285F4" },
    feeds: ["https://deepmind.google/blog/rss.xml"],
  },
  {
    name: "Andrej Karpathy",
    aussehen: { farbe: "#8F9AAD" },
    feeds: [
      "https://karpathy.bearblog.dev/feed/",
      "https://karpathy.github.io/feed.xml",
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQN11PqgIvyuvQ",
    ],
  },
  {
    name: "Matt Pocock",
    aussehen: { farbe: "#A3A08F" },
    feeds: [
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCswG6FSbgZjbWtdf_hMLaow",
      "https://www.aihero.dev/rss.xml",
    ],
  },
  {
    name: "The Decoder",
    aussehen: { farbe: "#7FA8AE" },
    feeds: ["https://the-decoder.de/feed/"],
  },
  {
    name: "The Verge",
    aussehen: { farbe: "#9479FF" },
    feeds: [
      "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    ],
  },
  {
    name: "Hacker News",
    aussehen: { farbe: "#B5B5AA", marke: "#FF6600" },
    feeds: ["https://hnrss.org/newest?q=AI&points=100"],
  },
];
