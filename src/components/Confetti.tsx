import React, { useEffect, useRef } from "react";

interface ConfettiProps {
  x: number;
  y: number;
}

const COLORS = [
  "#ff4081", "#ffeb3b", "#00e5ff", "#76ff03",
  "#d500f9", "#ff6d00", "#ffd740", "#18ffff",
  "#ff1744", "#651fff", "#00e676", "#ff9100",
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  gravity: number;
  friction: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "rect" | "star";
}

const Confetti: React.FC<ConfettiProps> = ({ x, y }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const PARTICLE_COUNT = 60;
    const shapes: Particle["shape"][] = ["circle", "rect", "star"];

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 10;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        gravity: 0.15 + Math.random() * 0.1,
        friction: 0.98,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });

    // Add sparkle trail particles
    const sparkles: Particle[] = [];

    const drawStar = (cx: number, cy: number, r: number, rotation: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const method = i === 0 ? "moveTo" : "lineTo";
        ctx[method](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Add sparkle trails for first 15 frames
      if (frame < 15) {
        for (const p of particles) {
          if (Math.random() < 0.3) {
            sparkles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              size: 1 + Math.random() * 2,
              color: p.color,
              alpha: 0.8,
              gravity: 0.02,
              friction: 0.99,
              rotation: 0,
              rotationSpeed: 0,
              shape: "circle",
            });
          }
        }
      }

      // Update & draw sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.alpha -= 0.03;
        s.x += s.vx;
        s.y += s.vy + s.gravity;
        if (s.alpha <= 0) {
          sparkles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update & draw main particles
      let alive = false;
      for (const p of particles) {
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= 0.012;

        if (p.alpha <= 0) continue;
        alive = true;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
          ctx.restore();
        } else {
          drawStar(p.x, p.y, p.size, p.rotation);
        }
      }

      ctx.globalAlpha = 1;

      if (alive || sparkles.length > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animRef.current);
  }, [x, y]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 300 }}
    />
  );
};

export default Confetti;
