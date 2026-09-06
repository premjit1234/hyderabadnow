import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Default is 1MB, which is too small for our photo-upload forms
      // (listings, projects, home tiles all accept multiple image files
      // through a Server Action). 20MB comfortably covers up to ~15
      // photos at a few MB each.
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
