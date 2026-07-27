import { ImageResponse } from "next/og";
import { siteDescription, siteName } from "@/lib/site";

export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #132820 0%, #1f3d32 55%, #2f6b55 100%)",
          color: "#f7f8f6",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Calm · Comfort · Groom
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 24 }}>
          {siteName}
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            marginTop: 28,
            maxWidth: 900,
            opacity: 0.92,
          }}
        >
          {siteDescription}
        </div>
      </div>
    ),
    { ...size },
  );
}
