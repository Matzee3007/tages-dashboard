import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tages-Dashboard",
    short_name: "Heute",
    description: "Sport, Schritte und KI-News auf einen Blick",
    start_url: "/",
    display: "standalone",
    background_color: "#0E1013",
    theme_color: "#0E1013",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
