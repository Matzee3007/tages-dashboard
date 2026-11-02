// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import manifest from "@/app/manifest";

test("nennt Namen, Start und Farben", () => {
  expect(manifest()).toMatchObject({
    name: "Tages-Dashboard",
    short_name: "Heute",
    start_url: "/",
    display: "standalone",
    background_color: "#0E1013",
    theme_color: "#0E1013",
  });
});

// Die Breite steht in jeder PNG-Datei ab Byte 16, die Höhe ab Byte 20.
test("jedes Symbol gibt es in der genannten Größe", () => {
  const symbole = manifest().icons!;
  expect(symbole.map((symbol) => symbol.sizes)).toEqual(["192x192", "512x512"]);
  for (const symbol of symbole) {
    const datei = readFileSync(join(process.cwd(), "public", symbol.src));
    expect(`${datei.readUInt32BE(16)}x${datei.readUInt32BE(20)}`).toBe(
      symbol.sizes,
    );
  }
});
