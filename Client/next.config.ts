import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// Allow configuring image domains via env var NEXT_PUBLIC_IMAGE_DOMAINS (comma-separated)
const allowedImageDomains = process.env.NEXT_PUBLIC_IMAGE_DOMAINS
  ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',').map(d => d.trim()).filter(Boolean)
  : [];

// Determine if we're in development mode
const isProduction = process.env.NODE_ENV === 'production';

// Security headers including Content Security Policy
const securityHeaders = [
  // CSP is now handled in middleware.ts to support nonces
  /*
  {
    key: 'Content-Security-Policy',
    value: `...`
  },
  */
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  ...(isProduction ? [{
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }] : []),
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }
];

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      ...allowedImageDomains.map(domain => ({
        protocol: 'https' as const,
        hostname: domain,
        pathname: '/**',
      })),
      {
        protocol: 'https' as const,
        hostname: 'www.gutenberg.org',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'covers.openlibrary.org',
        pathname: '/**',
      }
    ],
    // When no domains are provided, disable Next.js image optimization so external URLs still render.
    // This keeps development simple; for production, configure domains and remove this fallback.
    unoptimized: process.env.NODE_ENV !== 'production' && allowedImageDomains.length === 0,
    // Configure allowed image quality values for Next.js 16+ compatibility
    qualities: [70, 75, 80, 90],
  },
  // If no domains configured, fall back to unoptimized image loading to avoid build/runtime errors.
  // In production you should set NEXT_PUBLIC_IMAGE_DOMAINS to include your storage host for better performance.
  experimental: {},
  
  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
