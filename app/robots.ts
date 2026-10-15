import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
    const base = process.env.SITE_URL;
    return { rules: process.env.SITE_INDEXABLE === "true" ? { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] } : { userAgent: "*", disallow: "/" }, ...(base ? { sitemap: new URL("/sitemap.xml", base).href } : {}) };
}
