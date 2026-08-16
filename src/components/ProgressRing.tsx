"use client";

import { useEffect, useState } from "react";

/** Large animated circular progress ring for the 4,000-hour mission. */
export function ProgressRing({
  percent,
  size = 240,
  stroke = 16,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
}) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setP(Math.max(0, Math.min(100, percent))), 100);
    return () => clearTimeout(t);
  }, [percent]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (p / 100) * circumference;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2d55" />
            <stop offset="100%" stopColor="#ff5c7a" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1b212c"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        {label}
        {sublabel}
      </div>
    </div>
  );
}
