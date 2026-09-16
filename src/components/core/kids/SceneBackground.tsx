import React from 'react';

export const SceneBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, #7DD3FC 0%, #BAE6FD 45%, #E0F2FE 65%, #86EFAC 65%, #4ADE80 75%, #16A34A 100%)" }}
      />

      {/* Sun */}
      <div
        className="absolute rounded-full"
        style={{
          width: 90, height: 90,
          top: 24, right: "12%",
          background: "radial-gradient(circle, #FDE68A 40%, #FCD34D 70%, #F59E0B 100%)",
          boxShadow: "0 0 60px 20px rgba(253,230,138,0.5)",
        }}
      />
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4, height: 28,
            top: 24 + 43 - 14,
            right: `calc(12% + 43px - 2px)`,
            background: "#FCD34D",
            opacity: 0.7,
            transformOrigin: "2px 57px",
            transform: `rotate(${i * 45}deg) translateY(-70px)`,
          }}
        />
      ))}

      {/* Clouds */}
      <Cloud style={{ top: 40, left: "8%", transform: "scale(1.2)" }} delay="0s" />
      <Cloud style={{ top: 80, left: "35%", transform: "scale(0.85)" }} delay="1.5s" />
      <Cloud style={{ top: 30, left: "60%", transform: "scale(1.4)" }} delay="0.8s" />
      <Cloud style={{ top: 100, right: "5%", transform: "scale(0.9)" }} delay="2s" />

      {/* Far hills */}
      <svg className="absolute w-full" style={{ bottom: "28%", opacity: 0.6 }} viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,80 Q180,20 360,70 Q540,120 720,55 Q900,0 1080,65 Q1260,120 1440,60 L1440,120 L0,120 Z" fill="#86EFAC" />
      </svg>

      {/* Mid ground green */}
      <svg className="absolute w-full" style={{ bottom: "18%" }} viewBox="0 0 1440 140" preserveAspectRatio="none">
        <path d="M0,60 Q200,10 400,50 Q600,90 800,35 Q1000,0 1200,45 Q1350,75 1440,40 L1440,140 L0,140 Z" fill="#4ADE80" />
      </svg>

      {/* Foreground ground */}
      <div className="absolute left-0 right-0 bottom-0" style={{ height: "22%", background: "#16A34A" }} />

      {/* Grass tufts */}
      {[8, 22, 40, 58, 73, 88].map((left, i) => (
        <GrassTuft key={`gt-${i}`} left={left} delay={`${i * 0.3}s`} />
      ))}

      {/* Trees */}
      <Tree style={{ bottom: "18%", left: "3%" }} scale={1} />
      <Tree style={{ bottom: "18%", left: "10%" }} scale={0.75} />
      <Tree style={{ bottom: "19%", right: "4%" }} scale={1.1} />
      <Tree style={{ bottom: "19%", right: "11%" }} scale={0.8} />

      {/* Flowers */}
      {[15, 28, 45, 62, 80].map((left, i) => (
        <Flower key={i} left={left} color={["#F87171", "#FBBF24", "#A78BFA", "#34D399", "#FB7185"][i]} />
      ))}

      {/* Floating stars */}
      {[
        { x: "20%", y: "15%", size: 18, delay: "0s" },
        { x: "45%", y: "8%", size: 14, delay: "0.7s" },
        { x: "75%", y: "20%", size: 20, delay: "1.2s" },
        { x: "88%", y: "12%", size: 12, delay: "0.4s" },
      ].map((s, i) => (
        <div
          key={i}
          className="absolute animate-kids-star"
          style={{ left: s.x, top: s.y, animationDelay: s.delay, fontSize: s.size }}
        >
          ⭐
        </div>
      ))}
    </div>
  );
};

function Cloud({ style, delay }: { style: React.CSSProperties; delay: string }) {
  return (
    <div className="absolute animate-kids-cloud" style={{ ...style, animationDelay: delay }}>
      <div className="relative">
        <div className="rounded-full bg-white/90" style={{ width: 80, height: 40, position: "absolute", top: 0, left: 20 }} />
        <div className="rounded-full bg-white/90" style={{ width: 60, height: 32, position: "absolute", top: 8, left: 0 }} />
        <div className="rounded-full bg-white/90" style={{ width: 50, height: 28, position: "absolute", top: 6, left: 60 }} />
        <div className="rounded-full bg-white" style={{ width: 120, height: 36, position: "relative", top: 16 }} />
      </div>
    </div>
  );
}

function Tree({ style, scale }: { style: React.CSSProperties; scale: number }) {
  return (
    <div className="absolute animate-kids-float-slow" style={{ ...style, animationDuration: `${3.5 + scale}s` }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: "bottom center" }}>
        <div className="mx-auto rounded-sm" style={{ width: 14, height: 32, background: "#92400E", marginTop: -8 }} />
        <div className="rounded-full" style={{ width: 70, height: 65, background: "#15803D", marginLeft: -28, marginTop: -55, borderRadius: "50% 50% 45% 45%" }} />
        <div className="rounded-full" style={{ width: 85, height: 75, background: "#16A34A", marginLeft: -36, marginTop: -45, borderRadius: "50% 50% 45% 45%" }} />
        <div className="rounded-full" style={{ width: 65, height: 60, background: "#22C55E", marginLeft: -26, marginTop: -30, borderRadius: "50% 50% 45% 45%" }} />
      </div>
    </div>
  );
}

function GrassTuft({ left, delay }: { left: number; delay: string; key?: React.Key }) {
  return (
    <div className="absolute animate-kids-wiggle" style={{ left: `${left}%`, bottom: "21%", animationDelay: delay }}>
      <svg width="32" height="24" viewBox="0 0 32 24">
        <path d="M16 24 C16 24 8 16 10 8 C10 8 14 12 16 24Z" fill="#15803D" />
        <path d="M16 24 C16 24 22 14 24 6 C24 6 20 12 16 24Z" fill="#16A34A" />
        <path d="M16 24 C16 24 12 10 6 4 C6 4 14 14 16 24Z" fill="#22C55E" />
        <path d="M16 24 C16 24 20 12 26 8 C26 8 18 16 16 24Z" fill="#4ADE80" />
      </svg>
    </div>
  );
}

function Flower({ left, color }: { left: number; color: string; key?: React.Key }) {
  return (
    <div className="absolute" style={{ left: `${left}%`, bottom: "20%" }}>
      <div style={{ fontSize: 20 }}>🌸</div>
    </div>
  );
}
