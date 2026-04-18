export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base */}
      <div className="absolute inset-0 bg-bg-base" />

      {/* Orb 1 — top right subtle blue */}
      <div
        className="absolute -top-[10%] -right-[5%] w-[55vw] h-[55vw] rounded-full blur-[140px] opacity-30 animate-orb-float"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)' }}
      />

      {/* Orb 2 — bottom left subtle purple */}
      <div
        className="absolute top-[50%] -left-[10%] w-[45vw] h-[45vw] rounded-full blur-[130px] opacity-20 animate-orb-float-reverse"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', animationDelay: '-8s' }}
      />

      {/* Orb 3 — center subtle blue */}
      <div
        className="absolute top-[30%] left-[40%] w-[30vw] h-[30vw] rounded-full blur-[100px] opacity-15 animate-orb-breathe"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%)', animationDelay: '-5s' }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, transparent 0%, transparent 40%, rgba(12,14,18,0.5) 100%)'
        }}
      />
    </div>
  );
}
