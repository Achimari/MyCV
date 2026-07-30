/** Бумажная фактура поверх всей страницы. Не перехватывает события. */
export function GrainOverlay() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-raised">
      <div className="paper-grain absolute inset-0 opacity-[0.055] mix-blend-screen" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </div>
  );
}

export default GrainOverlay;
