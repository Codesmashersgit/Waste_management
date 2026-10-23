import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "node:path";

// Keep the existing root .env usable while the Next.js project lives in apps/web.
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
