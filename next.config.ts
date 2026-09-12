import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  pageExtensions: ["ts", "tsx"],
  experimental: {
    optimizePackageImports: ["@radix-ui/*"],
  },
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "encoding");
    return config;
  },
};

export default nextConfig;
