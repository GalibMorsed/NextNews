import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  reactCompiler: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
      },
    ],
  },
};

export default nextConfig;
