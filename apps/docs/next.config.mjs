import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  agentRules: false,
  // puck-kit's exports point at its TypeScript source (live previews render the real components).
  transpilePackages: ['puck-kit'],
  // Twoslash and the type-table generator use the TypeScript compiler at build time.
  serverExternalPackages: ['typescript', 'twoslash'],
};

export default withMDX(config);
