import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/conversations",
  //       permanent: true,
  //     },
  //   ];
  // },
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Disable the error overlay
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    return config;
  },
  // Hide the Next.js logo
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: "bottom-right",
  },
};

export default nextConfig;
