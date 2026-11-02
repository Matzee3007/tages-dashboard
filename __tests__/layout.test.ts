import { expect, test, vi } from "vitest";
import { metadata, viewport } from "@/app/layout";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "" }),
  Geist_Mono: () => ({ variable: "" }),
}));

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
