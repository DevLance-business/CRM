export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="ambient-orb animate-float-slow"
        style={{
          top: "-12rem",
          left: "-8rem",
          width: "36rem",
          height: "36rem",
          background:
            "radial-gradient(circle at center, rgba(37,99,235,0.45), transparent 60%)",
        }}
      />
      <div
        className="ambient-orb animate-float-slow-rev"
        style={{
          top: "20%",
          right: "-10rem",
          width: "32rem",
          height: "32rem",
          background:
            "radial-gradient(circle at center, rgba(34,211,238,0.35), transparent 60%)",
        }}
      />
      <div
        className="ambient-orb animate-float-slow"
        style={{
          bottom: "-14rem",
          left: "30%",
          width: "34rem",
          height: "34rem",
          background:
            "radial-gradient(circle at center, rgba(96,165,250,0.3), transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(15,23,42,0.025) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
    </div>
  );
}