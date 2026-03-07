import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {},
  // Disable exhaustive static rendering timeouts which crash due to disconnected DBs
  staticPageGenerationTimeout: 1,
};

export default nextConfig;
