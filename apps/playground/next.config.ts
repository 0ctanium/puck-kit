import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // puck-kit's exports point at its TypeScript source, so Next compiles it directly (no tsdown step in dev).
  transpilePackages: ["puck-kit"],
};

export default nextConfig;
