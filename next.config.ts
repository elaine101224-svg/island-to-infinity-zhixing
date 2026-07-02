import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern formats (AVIF, then WebP) when the browser supports them.
    // AVIF is typically ~20% smaller than WebP for photographic content.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
