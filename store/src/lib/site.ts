export const siteName = "NestPaw";

export const siteDescription =
  "Premium dog comfort and home-ease accessories. Calm enrichment and grooming essentials for dogs at home — U.S. shipping.";

function normalizeSiteUrl(url: string | undefined) {
  return url?.replace(/\/$/, "") || "";
}

/**
 * Local: prefers NEXT_PUBLIC_SITE_URL_LOCAL (defaults to localhost).
 * Production/preview: prefers NEXT_PUBLIC_SITE_URL (shopnestpaw.com).
 */
export function getSiteUrl() {
  const productionUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const localUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL_LOCAL);

  if (process.env.NODE_ENV === "development") {
    return localUrl || "http://localhost:3000";
  }

  return productionUrl || localUrl || "http://localhost:3000";
}
