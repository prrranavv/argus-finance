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
    domains: [
      's3.amazonaws.com',
      'splitwise.s3.amazonaws.com',
      'secure.gravatar.com',
      'avatar.splitwise.com'
    ],
  },
};

export default nextConfig;
