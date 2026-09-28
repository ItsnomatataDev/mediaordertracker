import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for the Hetzner Docker image. Vercel needs the default Next output.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/sw.js",
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    }];
  },
};

export default nextConfig;
