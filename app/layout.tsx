import type { Metadata, Viewport } from "next";
import { Commissioner } from "next/font/google";
import "./globals.css";

// Eine variable Schrift: Die Ordnung läuft über feine Stufen im Gewicht (280 bis 720).
const commissioner = Commissioner({
  variable: "--font-commissioner",
  subsets: ["latin"],
  weight: "variable",
});

export const metadata: Metadata = {
  title: "Tages-Dashboard",
  description: "Sport, Schritte und KI-News auf einen Blick",
  // Safari nimmt Name und Symbol der installierten App von hier, nicht nur aus dem Manifest.
  appleWebApp: { capable: true, title: "Heute", statusBarStyle: "black" },
  icons: { icon: "/icons/favicon-32.png", apple: "/icons/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#0F1318",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${commissioner.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
