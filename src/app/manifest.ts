import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "IT's No Matata · Media Portal",
    short_name: "Matata Media",
    description: "Create, manage and collect flight media packages.",
    start_url: "/packages",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" }],
    shortcuts: [
      { name: "New package", url: "/packages/new" },
      { name: "Packages", url: "/packages" },
    ],
  };
}
