// @vitest-environment node
import { expect, test } from "vitest";
import {
  KACHELN,
  TEAMS_CHAMPIONS_LEAGUE,
  type FussballEinstellung,
} from "@/lib/einstellungen";

test("eine Tabelle von football-data.org verlangt die ids von football-data.org", () => {
  // npm run typecheck wird rot, wenn der Typ ein Team ohne footballData erlaubt.
  // @ts-expect-error Team ohne footballData
  const einstellung: FussballEinstellung = {
    id: "champions-league",
    art: "fussball",
    titel: "Champions League",
    espn: "uefa.champions",
    kalender: { art: "spielplan" },
    spielplan: { art: "football-data", wettbewerb: "CL" },
    tabelle: { art: "football-data", wettbewerb: "CL" },
    teams: [{ espn: "132", name: "Bayern" }],
    meinTeam: ["132"],
    zonen: [],
  };
  expect(einstellung.teams).toHaveLength(1);
});

test("die Champions League kennt 36 Teams mit eindeutigen ids, darunter Bayern und Arsenal", () => {
  expect(TEAMS_CHAMPIONS_LEAGUE).toHaveLength(36);
  expect(new Set(TEAMS_CHAMPIONS_LEAGUE.map((t) => t.espn)).size).toBe(36);
  expect(new Set(TEAMS_CHAMPIONS_LEAGUE.map((t) => t.footballData)).size).toBe(
    36,
  );
  expect(TEAMS_CHAMPIONS_LEAGUE).toContainEqual({
    espn: "132",
    footballData: 5,
    name: "Bayern",
  });
  expect(TEAMS_CHAMPIONS_LEAGUE).toContainEqual({
    espn: "359",
    footballData: 57,
    name: "Arsenal",
  });
});

test("die NFL steht nach der Champions League im Reiter Sport, Mein Team sind die Seahawks", () => {
  const ids = KACHELN.map((kachel) => kachel.id);
  expect(ids.indexOf("nfl")).toBe(ids.indexOf("champions-league") + 1);
  const nfl = KACHELN.find((kachel) => kachel.id === "nfl");
  expect(nfl).toMatchObject({
    art: "nfl",
    gruppe: "Sport",
    meinTeam: ["26"],
    division: "NFC West",
    conference: "National Football Conference",
    aussehen: { kuerzel: "NFL" },
  });
});
