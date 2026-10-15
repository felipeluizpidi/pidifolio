import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 82],
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/placeholders/**" }],
  },
  // STORAGE_DIR/UPLOAD_DIR are built at runtime (path.resolve(env ?? cwd+"storage")), so
  // Next's file tracer can't statically resolve them and conservatively bundles the whole
  // storage/ tree — 246MB of uploads — into every function that imports lib/store.ts. Pin
  // each function to only what it actually needs, or we blow past Vercel's function-size
  // budget and it silently gets reported back as "too many serverless functions".
  outputFileTracingIncludes: {
    "/**": ["./storage/content.json"],
    "/media/\\[\\.\\.\\.path\\]": ["./storage/uploads/**/*"],
  },
  // Scoped per-route (not "/**") so it can't also strip the include above for the one
  // route that's actually supposed to have the uploads folder.
  outputFileTracingExcludes: {
    "/\\[locale\\]": ["./storage/uploads/**/*"],
    "/\\[locale\\]/work/\\[slug\\]": ["./storage/uploads/**/*"],
    "/admin": ["./storage/uploads/**/*"],
    "/admin/login": ["./storage/uploads/**/*"],
    "/admin/media": ["./storage/uploads/**/*"],
    "/admin/messages": ["./storage/uploads/**/*"],
    "/admin/projects/\\[id\\]": ["./storage/uploads/**/*"],
    "/admin/settings": ["./storage/uploads/**/*"],
    "/api/admin/upload": ["./storage/uploads/**/*"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
