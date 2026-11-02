import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tages-Dashboard",
  description: "Sport, Schritte und KI-News auf einen Blick",
  // Safari nimmt Name und Symbol der installierten App von hier, nicht nur aus dem Manifest.
  appleWebApp: { capable: true, title: "Heute", statusBarStyle: "black" },
  icons: { icon: "/icons/favicon-32.png", apple: "/icons/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: "#0E1013",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
