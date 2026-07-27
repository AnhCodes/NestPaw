export const siteName = "NestPaw";

export const siteDescription =
  "Premium dog comfort and home-ease accessories. Calm enrichment and grooming essentials for dogs at home — U.S. shipping.";

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}
