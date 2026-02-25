import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NFT Marketplace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 50%, #0A0A0F 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
            }}
          >
            ◆
          </div>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #A855F7, #3B82F6)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            NFT Marketplace
          </span>
        </div>
        <p
          style={{
            fontSize: "24px",
            color: "#9CA3AF",
            maxWidth: "600px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Discover, Collect & Sell Extraordinary Digital Assets on Ethereum
        </p>
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginTop: "40px",
          }}
        >
          {[
            { label: "Collections", value: "10K+" },
            { label: "NFTs", value: "500K+" },
            { label: "Artists", value: "50K+" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "32px", fontWeight: 700, color: "#F9FAFB" }}>
                {stat.value}
              </span>
              <span style={{ fontSize: "14px", color: "#6B7280" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
