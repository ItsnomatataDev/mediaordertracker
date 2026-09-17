import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone is for the Hetzner Docker image. Vercel needs the default Next output.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
};

export default nextConfig;
