import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Drop 16–128px candidates. iOS Safari often picks the smallest srcset
    // on refresh for absolutely positioned images, then caches the blur.
    imageSizes: [256, 384],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    qualities: [75, 90],
  },
};

export default nextConfig;
