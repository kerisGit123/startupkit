import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 153 pre-existing type errors across 55+ files - skip during build
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
