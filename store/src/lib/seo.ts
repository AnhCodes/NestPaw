import type { Metadata } from "next";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

type PageMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  image?: string;
};

export function createPageMetadata({
  title,
  description = siteDescription,
  path = "",
  noIndex = false,
  image,
}: PageMetadataOptions): Metadata {
  const url = `${getSiteUrl()}${path}`;
  const ogImage = image ?? `${getSiteUrl()}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: path || "/" },
    ...(noIndex
      ? { robots: { index: false, follow: false } }
      : { robots: { index: true, follow: true } }),
    openGraph: {
      title: `${title} · ${siteName}`,
      description,
      url,
      siteName,
      type: "website",
      locale: "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: siteName }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteName}`,
      description,
      images: [ogImage],
    },
  };
}
