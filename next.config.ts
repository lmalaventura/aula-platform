import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ["/redazione", "/api/redazione", "/api/redazione/:path*"].map(
      (source) => ({
        source,
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Cache-Control", value: "no-store" },
        ],
      }),
    );
  },
  serverExternalPackages: ["pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/studio/genera": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
  /* config options here */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
