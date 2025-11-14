import type { NextConfig } from "next";

// Allow configuring image domains via env var NEXT_PUBLIC_IMAGE_DOMAINS (comma-separated)
const allowedImageDomains = process.env.NEXT_PUBLIC_IMAGE_DOMAINS
  ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',').map(d => d.trim()).filter(Boolean)
  : [];

// Determine if we're in development mode
const isProduction = process.env.NODE_ENV === 'production';

// Security headers including Content Security Policy
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://unpkg.com;
      style-src 'self' 'unsafe-inline' blob:;
      style-src-elem 'self' 'unsafe-inline' blob:;
      img-src 'self' blob: data: https:;
      font-src 'self' data:;
      connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'} https://va.vercel-scripts.com https://*.backblazeb2.com https://unpkg.com;
      worker-src 'self' blob: https://unpkg.com;
      child-src 'self' blob:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      ${isProduction ? 'upgrade-insecure-requests;' : ''}
    `.replace(/\s{2,}/g, ' ').trim()
  },
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
    remotePatterns: allowedImageDomains.map(domain => ({
      protocol: 'https',
      hostname: domain,
      pathname: '/**',
    })),
    // When no domains are provided, disable Next.js image optimization so external URLs still render.
    // This keeps development simple; for production, configure domains and remove this fallback.
    unoptimized: allowedImageDomains.length === 0,
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

export default nextConfig;
