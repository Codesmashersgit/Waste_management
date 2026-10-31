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
      path.resolve(process.cwd(), "node_modules"),
      "node_modules",
      ...(config.resolve.modules || []),
    ];
    return config;
  },
};

export default nextConfig;
