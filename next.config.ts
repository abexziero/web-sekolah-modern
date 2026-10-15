import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { localPatterns: [{ pathname: "/images/**", search: "" }] },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
      ]
    }, {
      source: "/admin/:path*",
      headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
    }, ...["/admin/konten/:id/preview","/admin/berita/:id/preview"].map(source=>({source,headers:[{key:"X-Frame-Options",value:"SAMEORIGIN"},{key:"Content-Security-Policy",value:"frame-ancestors 'self'"}]}))];
  }
};

export default nextConfig;
