import { expect, test } from "vitest";
import { HEUTE, reiterListe, reiterVon } from "@/lib/kacheln/reiter";

const aussehen = { farbe: "#8E99A8" };
const BL = { id: "bundesliga", titel: "Bundesliga", aussehen, gruppe: "Sport" };
const PL = {
  id: "premier-league",
  titel: "Premier League",
  aussehen,
  gruppe: "Sport",
};
const KI_NEWS = { id: "ki-news", titel: "KI-News", aussehen };

test("eine Kachel gehört in den Reiter ihrer Gruppe, ohne Gruppe in den ihres Titels", () => {
  expect(reiterVon(BL)).toBe("Sport");
  expect(reiterVon(KI_NEWS)).toBe("KI-News");
});

test("reiterListe: Heute zuerst, dann Gruppe oder Titel in Reihenfolge der Kacheln", () => {
  expect(reiterListe([BL, PL, KI_NEWS])).toEqual([HEUTE, "Sport", "KI-News"]);
  expect(reiterListe([KI_NEWS, BL])).toEqual([HEUTE, "KI-News", "Sport"]);
});

test("ohne Kacheln gibt es nur Heute", () => {
  expect(reiterListe([])).toEqual(["Heute"]);
});
