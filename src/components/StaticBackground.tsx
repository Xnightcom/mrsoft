export default function StaticBackground() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#060606",
        overflow: "hidden",
      }}
    >
      {/* Top left red glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: "radial-gradient(circle, " + "rgba(204,0,0,0.12) 0%, " + "transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Bottom right green glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: "radial-gradient(circle, " + "rgba(26,107,26,0.12) 0%, " + "transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Center subtle red */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80%",
          height: "40%",
          background: "radial-gradient(ellipse, " + "rgba(204,0,0,0.05) 0%, " + "transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      {/* Top right green accent */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "5%",
          width: "30%",
          height: "30%",
          borderRadius: "50%",
          background: "radial-gradient(circle, " + "rgba(26,107,26,0.08) 0%, " + "transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Bottom left green accent */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "5%",
          width: "25%",
          height: "25%",
          borderRadius: "50%",
          background: "radial-gradient(circle, " + "rgba(26,107,26,0.07) 0%, " + "transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Subtle grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
          linear-gradient(
            rgba(255,255,255,0.015) 1px, 
            transparent 1px
          ),
          linear-gradient(
            90deg,
            rgba(255,255,255,0.015) 1px,
            transparent 1px
          )
        `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Noise texture overlay for depth */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
