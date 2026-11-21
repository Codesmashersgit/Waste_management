import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "node:path";

// Load shared server secrets from the backend app.
dotenv.config({ path: path.resolve(process.cwd(), "../backend/.env") });

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(process.cwd(), "node_modules"),
    ];
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "@solana/codecs-data-structures": false,
      "@solana/kit": false,
      "@solana/codecs": false,
      "@solana/errors": false,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
