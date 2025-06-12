import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      { hostname: 's3.amazonaws.com' },
      { hostname: 'splitwise.s3.amazonaws.com' },
      { hostname: 'secure.gravatar.com' },
      { hostname: 'avatar.splitwise.com' }
    ],
  },
};

export default nextConfig;
