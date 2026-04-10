import type { NextConfig } from "next";

const allowedDevOrigins = [
  "localhost",
  "127.0.0.1",
  "192.168.0.104",
  "192.168.0.106",
  process.env.NEXT_ALLOWED_DEV_ORIGIN,
].filter((origin): origin is string => Boolean(origin));

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins,
};

export default nextConfig;
