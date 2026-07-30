import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "libsql",
  ],
  async redirects() {
    return [
      { source: "/fleet", destination: "/maintenance", permanent: false },
      { source: "/fleet/work-orders", destination: "/maintenance/work-orders", permanent: false },
      { source: "/fleet/work-orders/:id", destination: "/maintenance/work-orders/:id", permanent: false },
      { source: "/fleet/vendors", destination: "/maintenance/vendors", permanent: false },
      { source: "/fleet/service", destination: "/maintenance/service", permanent: false },
      { source: "/fleet/units", destination: "/maintenance/units", permanent: false },
      { source: "/fleet/units/:id", destination: "/maintenance/units/:id", permanent: false },
    ];
  },
};

export default nextConfig;
