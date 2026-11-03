import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Evidencias de hasta 3 MB + margen para el formulario (Vercel: 4.5 MB).
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
