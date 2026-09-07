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
    // Real-world uploaded photos (full-size phone/camera photos, a few MB
    // each) were coming out corrupted — a partial/garbled image — when
    // resized on the fly by Next's built-in image optimizer on the
    // production server. The raw uploaded file is always intact (confirmed:
    // fetching it directly from /api/uploads/... renders correctly); the
    // corruption only appears through the /_next/image resize step. That
    // matches a documented sharp/glibc memory-allocator issue on
    // resource-constrained Linux hosts (see self-hosting.md, "Image
    // Optimization may require additional configuration to prevent
    // excessive memory usage"). Disabling optimization serves every image
    // as-is instead — slightly heavier pages, but no more broken photos.
    unoptimized: true,
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
