import { ImageResponse } from "next/og";

export const alt = "Artisan Relance — Vos devis se relancent tout seuls";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: 36, fontWeight: 600 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            R
          </div>
          Artisan Relance
        </div>
        <div style={{ marginTop: 48, fontSize: 76, fontWeight: 700, lineHeight: 1.1, display: "flex", flexWrap: "wrap" }}>
          Vos devis se relancent&nbsp;<span style={{ color: "#f97316" }}>tout seuls.</span>
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: "#a1a1aa" }}>
          Relances e-mail automatiques à J+4 et J+10 pour les artisans.
        </div>
      </div>
    ),
    size,
  );
}
