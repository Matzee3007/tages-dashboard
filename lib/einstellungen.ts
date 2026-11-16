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
