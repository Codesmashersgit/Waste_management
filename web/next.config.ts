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
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@noble/hashes/sha3.js': '@noble/hashes/sha3',
      '@noble/hashes/sha2.js': '@noble/hashes/sha2',
      '@noble/hashes/sha256.js': '@noble/hashes/sha256',
      '@noble/hashes/sha512.js': '@noble/hashes/sha512',
      '@noble/hashes/ripemd160.js': '@noble/hashes/ripemd160',
      '@noble/hashes/hmac.js': '@noble/hashes/hmac',
      '@noble/hashes/pbkdf2.js': '@noble/hashes/pbkdf2',
      '@noble/hashes/utils.js': '@noble/hashes/utils',
      '@noble/hashes/_assert': path.resolve(process.cwd(), 'src/lib/noble-assert-shim.js'),
    };
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
