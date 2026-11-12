import type { NextConfig } from "next";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://auyvhebnlxymcrtyyyem.supabase.co").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Serve uploaded files from merchin.co/files/… instead of exposing the Supabase domain.
  async rewrites() {
    return [
      {
        source: "/files/:path*",
        destination: `${SUPABASE_URL}/storage/v1/object/public/order-inspiration/:path*`,
      },
    ];
  },
};

export default nextConfig;
