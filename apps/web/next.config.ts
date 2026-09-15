import path from "node:path";
import type { NextConfig } from "next";

const api = process.env.API_ORIGIN ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@sales/shared"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
