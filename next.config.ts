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
};

export default nextConfig;
