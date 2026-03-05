import React, { useMemo } from "react";

interface ConfettiProps {
  x: number;
  y: number;
}

const COLORS = [
  "hsl(340 100% 60%)",
  "hsl(55 100% 55%)",
  "hsl(200 100% 60%)",
  "hsl(140 80% 50%)",
  "hsl(280 100% 65%)",
  "hsl(30 100% 55%)",
];

const Confetti: React.FC<ConfettiProps> = ({ x, y }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        angle: (i / 24) * 360,
        distance: 40 + Math.random() * 100,
        size: 4 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 0.3,
        duration: 0.8 + Math.random() * 0.7,
      })),
    []
  );

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, zIndex: 200 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-confetti"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: 0,
            top: 0,
            transform: `translate(${Math.cos((p.angle * Math.PI) / 180) * p.distance}px, ${Math.sin((p.angle * Math.PI) / 180) * p.distance}px)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
