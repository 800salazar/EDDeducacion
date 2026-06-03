import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Educación";
export const size = {
  width: 1200,
  height: 630,
};
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
          justifyContent: "space-between",
          background: "linear-gradient(120deg, #1f2937 0%, #4b5563 48%, #9ca3af 100%)",
          color: "white",
          padding: "56px 64px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "62px",
              height: "62px",
              borderRadius: "999px",
              background: "white",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            <div style={{ fontSize: "20px", opacity: 0.9 }}>Plataforma</div>
            <div style={{ fontSize: "42px", fontWeight: 700, lineHeight: 1.05 }}>Educación</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 0.98,
              maxWidth: "1020px",
              letterSpacing: "-0.02em",
            }}
          >
            Educación
          </div>
          <div
            style={{
              fontSize: "31px",
              opacity: 0.95,
              maxWidth: "980px",
              lineHeight: 1.25,
            }}
          >
            Aprendizaje practico semanal para aplicar en tu negocio.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
