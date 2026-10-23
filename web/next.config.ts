import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "node:path";

// Load shared server secrets from the backend app.
dotenv.config({ path: path.resolve(process.cwd(), "../backend/.env") });

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
