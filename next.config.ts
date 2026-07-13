import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.trycloudflare.com"],
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    // Mobile-first viewport breakpoints
    deviceSizes: [390, 430, 768, 1024, 1280],
    imageSizes: [64, 128, 256, 384],
  },

  experimental: {
    // Tree-shake large barrel-file packages at build time
    optimizePackageImports: ["framer-motion", "radix-ui", "lucide-react"],
    serverActions: {
      // Headroom over storage's MAX_UPLOAD_BYTES (5MB) for multipart overhead
      bodySizeLimit: "6mb",
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
