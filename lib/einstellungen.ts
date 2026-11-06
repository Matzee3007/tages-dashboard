export type KachelEinstellung = { id: string; art: "ki-news"; titel: string };

// Die Reihenfolge hier ist die Reihenfolge auf dem Bildschirm.
export const KACHELN: KachelEinstellung[] = [
  { id: "ki-news", art: "ki-news", titel: "KI-News" },
];

export type AbsenderEinstellung = { name: string; feeds: string[] };

export const ABSENDER: AbsenderEinstellung[] = [
  {
    name: "Anthropic",
    feeds: [
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCrDwWp7EBBv4NwvScIpBDOA",
      "https://transformer-circuits.pub/feed.xml",
    ],
  },
  {
    name: "Claude Updates",
    feeds: ["https://platform.claude.com/docs/en/release-notes/feed.xml"],
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
