import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Return request",
  description:
    "Start a NestPaw return request for damaged, incorrect, or defective U.S. orders.",
  path: "/returns",
});

export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
