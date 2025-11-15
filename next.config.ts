import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable gzip/brotli compression
  compress: true,

  // Image optimization settings
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
  },

  // Logging for debugging fetch performance
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
