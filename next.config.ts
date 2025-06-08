import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      's3.amazonaws.com',
      'splitwise.s3.amazonaws.com',
      'secure.gravatar.com',
      'avatar.splitwise.com'
    ],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
