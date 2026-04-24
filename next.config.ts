import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

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

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
