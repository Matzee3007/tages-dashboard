import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { metadata, viewport } from "@/app/layout";

vi.mock("next/font/google", () => ({
  Barlow: () => ({ variable: "" }),
  Barlow_Condensed: () => ({ variable: "" }),
}));

test("globals.css legt die Design-Token fest", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  expect(css).toContain("--color-grund: #0e1013");
  expect(css).toContain("--color-akzent: #ff8a3d");
});

test("meldet die App bei Apple-Geräten an", () => {
  expect(metadata.appleWebApp).toEqual({
    capable: true,
    title: "Heute",
    statusBarStyle: "black",
  });
  expect(metadata.icons).toEqual({
    icon: "/icons/favicon-32.png",
    apple: "/icons/icon-180.png",
  });
  expect(viewport.themeColor).toBe("#0E1013");
});

// Die Breite steht in jeder PNG-Datei ab Byte 16, die Höhe ab Byte 20.
test.each([
  ["/icons/favicon-32.png", "32x32"],
  ["/icons/icon-180.png", "180x180"],
])("%s gibt es in der Größe %s", (pfad, groesse) => {
  const datei = readFileSync(join(process.cwd(), "public", pfad));
  expect(`${datei.readUInt32BE(16)}x${datei.readUInt32BE(20)}`).toBe(groesse);
});
