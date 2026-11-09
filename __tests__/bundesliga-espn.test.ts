// @vitest-environment node
import { expect, test } from "vitest";
import { leseKalender } from "@/lib/kacheln/bundesliga/espn";

// Ausschnitte echter Antworten von ESPN vom 2026-11-08, gekürzt auf die gelesenen Felder.

test("liest die Tage des Kalenders", () => {
  const json = {
    leagues: [
      {
        calendar: [
          "2026-11-06T08:00Z",
          "2026-11-07T08:00Z",
          "2026-11-08T08:00Z",
          "2026-11-20T08:00Z",
        ],
      },
    ],
  };
  expect(leseKalender(json)).toEqual([
    "2026-11-06",
    "2026-11-07",
    "2026-11-08",
    "2026-11-20",
  ]);
});
