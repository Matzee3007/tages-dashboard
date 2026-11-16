import type { SeitenArt } from "@/lib/kacheln/ki-news/seiten";

export type KiNewsEinstellung = { id: string; art: "ki-news"; titel: string };

// Ein Team mit id bei ESPN, id bei football-data.org (falls die Liga sie braucht) und deutschem Kurznamen.
export type Team = { espn: string; footballData?: number; name: string };

// Eine Fußball-Liga: Partien immer von ESPN, Spielplan (Nummer des Spieltags) und Tabelle je nach Quelle (ADR 0011).
// meinTeam: ids der Teams bei ESPN (Glossar: Mein Team).
export type LigaEinstellung = {
  id: string;
  art: "liga";
  titel: string;
  espn: "ger.1" | "eng.1";
  spielplan:
    | { art: "openligadb"; liga: "bl1" }
    | { art: "football-data"; wettbewerb: "PL" };
  tabelle: { art: "espn" } | { art: "football-data"; wettbewerb: "PL" };
  teams: Team[];
  meinTeam: string[];
};

export type KachelEinstellung = KiNewsEinstellung | LigaEinstellung;

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
export const TEAMS_PREMIER_LEAGUE: Team[] = [
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

// Die Reihenfolge hier ist die Reihenfolge auf dem Bildschirm.
export const KACHELN: KachelEinstellung[] = [
  // 132 ist der FC Bayern bei ESPN.
  {
    id: "bundesliga",
    art: "liga",
    titel: "Bundesliga",
    espn: "ger.1",
    spielplan: { art: "openligadb", liga: "bl1" },
    tabelle: { art: "espn" },
    teams: TEAMS_BUNDESLIGA,
    meinTeam: ["132"],
  },
  // 359 ist Arsenal bei ESPN.
  {
    id: "premier-league",
    art: "liga",
    titel: "Premier League",
    espn: "eng.1",
    spielplan: { art: "football-data", wettbewerb: "PL" },
    tabelle: { art: "football-data", wettbewerb: "PL" },
    teams: TEAMS_PREMIER_LEAGUE,
    meinTeam: ["359"],
  },
  { id: "ki-news", art: "ki-news", titel: "KI-News" },
];

export type SeitenEinstellung = { url: string; art: SeitenArt };

export type AbsenderEinstellung = {
  name: string;
  feeds: string[];
  seiten?: SeitenEinstellung[];
};

export const ABSENDER: AbsenderEinstellung[] = [
  {
    name: "Anthropic",
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
    feeds: ["https://platform.claude.com/docs/en/release-notes/feed.xml"],
    seiten: [
      {
        url: "https://support.claude.com/en/articles/12138966-release-notes",
        art: "versionshinweise",
      },
    ],
  },
  { name: "OpenAI", feeds: ["https://openai.com/news/rss.xml"] },
  { name: "Google DeepMind", feeds: ["https://deepmind.google/blog/rss.xml"] },
  {
    name: "Andrej Karpathy",
    feeds: [
      "https://karpathy.bearblog.dev/feed/",
      "https://karpathy.github.io/feed.xml",
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCXUPKJO5MZQN11PqgIvyuvQ",
    ],
  },
  {
    name: "Matt Pocock",
    feeds: [
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCswG6FSbgZjbWtdf_hMLaow",
      "https://www.aihero.dev/rss.xml",
    ],
  },
  { name: "The Decoder", feeds: ["https://the-decoder.de/feed/"] },
  {
    name: "The Verge",
    feeds: [
      "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    ],
  },
  {
    name: "Hacker News",
    feeds: ["https://hnrss.org/newest?q=AI&points=100"],
  },
];
