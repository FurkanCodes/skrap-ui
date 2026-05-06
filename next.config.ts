import type { NextConfig } from "next";

const allowedDevOriginsFromEnv = process.env.ALLOWED_DEV_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins:
    allowedDevOriginsFromEnv && allowedDevOriginsFromEnv.length > 0
      ? allowedDevOriginsFromEnv
      : ["192.168.1.166"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
