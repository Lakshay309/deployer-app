import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname  // tells Next.js to stay in the frontend folder
  }
};

export default nextConfig;
