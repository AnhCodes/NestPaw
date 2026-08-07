import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/cart", "/api/", "/admin", "/admin/"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
