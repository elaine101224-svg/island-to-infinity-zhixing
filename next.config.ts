import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects(){return ['products','collaborations','story','faq','wechat','preview','orders','login'].map(path=>({source:'/sewing/'+path,destination:['orders','login'].includes(path)?'/sewing/manage':'/sewing/request',permanent:false}));},
  images: {
    // Serve modern formats (AVIF, then WebP) when the browser supports them.
    // AVIF is typically ~20% smaller than WebP for photographic content.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;


