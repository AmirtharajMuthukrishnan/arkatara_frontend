import type { NextConfig } from "next";
import { catalogueMediaOrigins } from "./src/lib/storefront-config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: catalogueMediaOrigins().map((origin) => {
      const url = new URL(origin);
      return {
        protocol: "https" as const,
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
        search: "",
      };
    }),
  },
};

export default nextConfig;
