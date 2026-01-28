import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'rainbowsolutionandtechnology.com',
      'localhost'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
   typescript: {
    // ⚠️ Production build me TypeScript errors ignore karega
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
