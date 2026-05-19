"use client";

export function DesktopBackground() {
  return (
    <>
      <div className="desktop-bg desktop-grain absolute inset-0 -z-10" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.30) 70%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}
