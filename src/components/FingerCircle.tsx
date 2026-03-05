import React from "react";

const FINGER_COLORS = [
  "340 100% 60%",
  "30 100% 55%",
  "55 100% 55%",
  "140 80% 50%",
  "180 100% 50%",
  "200 100% 60%",
  "260 100% 70%",
  "280 100% 65%",
  "320 100% 60%",
  "0 100% 60%",
];

interface FingerCircleProps {
  x: number;
  y: number;
  colorIndex: number;
  state: "active" | "stabilizing" | "pulsing" | "winner" | "loser" | "team-a" | "team-b";
  progress?: number;
  orderNumber?: number;
  delay?: number;
}

const FingerCircle: React.FC<FingerCircleProps> = ({
  x,
  y,
  colorIndex,
  state,
  progress = 0,
  orderNumber,
  delay = 0,
}) => {
  const color = FINGER_COLORS[colorIndex % 10];
  const size = state === "winner" ? 160 : 130;
  const halfSize = size / 2;

  const getClassName = () => {
    switch (state) {
      case "pulsing":
        return "animate-finger-pulse";
      case "winner":
        return "animate-winner-glow";
      case "loser":
        return "animate-shrink-out";
      default:
        return "";
    }
  };

  const ringRadius = 45;
  const circumference = 2 * Math.PI * ringRadius;

  return (
    <div
      className={`absolute pointer-events-none ${state === "active" ? "animate-finger-appear" : ""}`}
      style={{
        left: x - halfSize,
        top: y - halfSize,
        width: size,
        height: size,
        animationDelay: state === "loser" ? `${delay}ms` : undefined,
        zIndex: state === "winner" ? 100 : 10,
      }}
    >
      {/* Progress ring */}
      {state === "stabilizing" && progress > 0 && (
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r={ringRadius}
            fill="none"
            stroke={`hsl(${color} / 0.3)`}
            strokeWidth="4"
          />
          <circle
            cx="50"
            cy="50"
            r={ringRadius}
            fill="none"
            stroke={`hsl(${color})`}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
      )}

      {/* Main circle */}
      <div
        className={`absolute inset-2 rounded-full ${getClassName()}`}
        style={{
          backgroundColor: `hsl(${color} / 0.4)`,
          border: `3px solid hsl(${color})`,
          boxShadow: `0 0 20px hsl(${color} / 0.5), inset 0 0 20px hsl(${color} / 0.2)`,
          color: `hsl(${color})`,
          animationDelay: state === "loser" ? `${delay}ms` : undefined,
          animationFillMode: "forwards",
        }}
      />

      {/* Team indicator */}
      {(state === "team-a" || state === "team-b") && (
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: state === "team-a"
              ? "hsl(200 100% 60% / 0.4)"
              : "hsl(340 100% 60% / 0.4)",
            border: `3px solid ${state === "team-a" ? "hsl(200 100% 60%)" : "hsl(340 100% 60%)"}`,
            boxShadow: `0 0 25px ${state === "team-a" ? "hsl(200 100% 60% / 0.6)" : "hsl(340 100% 60% / 0.6)"}`,
          }}
        >
          <span className="text-lg font-bold text-white">
            {state === "team-a" ? "A" : "B"}
          </span>
        </div>
      )}

      {/* Order number */}
      {orderNumber !== undefined && (
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center animate-number-reveal"
          style={{
            backgroundColor: `hsl(${color} / 0.6)`,
            border: `3px solid hsl(${color})`,
            boxShadow: `0 0 30px hsl(${color} / 0.6)`,
            animationDelay: `${(orderNumber - 1) * 300}ms`,
            animationFillMode: "both",
          }}
        >
          <span className="text-2xl font-black text-white">{orderNumber}</span>
        </div>
      )}
    </div>
  );
};

export default FingerCircle;
