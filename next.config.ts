import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAInit({
  dest: "public",
  disable: false,
  register: true,
  // CRITICAL: Do NOT cache Next.js JS chunks or HTML pages.
  // The service worker was causing stale code to be served even after deployments.
  // Only cache static assets (images, fonts, etc.) that never change.
  skipWaiting: true,     // Immediately activate new SW when deployed
  clientsClaim: true,   // Take over all open tabs immediately on new SW
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },

  transpilePackages: ['react-map-gl', 'mapbox-gl', '@mapbox/search-js-react'],
  images: {
    // Optimization enabled — Cloudinary images are auto-resized & served as WebP
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  turbopack: {},
  async redirects() {
    return [
      {
        source: '/drivers',
        destination: '/driver',
        permanent: true,
      },
    ];
  },
};

export default withSentryConfig(withPWA(nextConfig), {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
