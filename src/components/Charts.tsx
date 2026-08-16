"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RetentionBucket, TimePoint } from "@/lib/types";

const AXIS = { stroke: "#5f6b7c", fontSize: 11 };
const GRID = "#1b212c";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#141922",
      border: "1px solid #232b38",
      borderRadius: 12,
      fontSize: 12,
      color: "#e6edf6",
    },
    labelStyle: { color: "#9aa7b8" },
  };
}

export function WatchTimeArea({ data, days = 90 }: { data: TimePoint[]; days?: number }) {
  const slice = data.slice(-days).map((p) => ({
    date: p.date.slice(5),
    "Watch hours": Math.round(p.watchHours),
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={slice} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff2d55" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#ff2d55" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} />
        <Tooltip {...tooltipStyle()} />
        <Area
          type="monotone"
          dataKey="Watch hours"
          stroke="#ff2d55"
          strokeWidth={2}
          fill="url(#wt)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SubscribersLine({ data, days = 90 }: { data: TimePoint[]; days?: number }) {
  const slice = data.slice(-days).map((p) => ({
    date: p.date.slice(5),
    Subscribers: p.subscribers,
  }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={slice} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip {...tooltipStyle()} />
        <Line type="monotone" dataKey="Subscribers" stroke="#38bdf8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RetentionCurveChart({ curve }: { curve: RetentionBucket[] }) {
  const data = curve.map((b) => ({ label: b.label, Retention: b.retention }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="ret" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} domain={[0, 100]} />
        <Tooltip {...tooltipStyle()} />
        <Area type="monotone" dataKey="Retention" stroke="#22c55e" strokeWidth={2} fill="url(#ret)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBar({
  data,
  dataKey,
  color = "#a78bfa",
}: {
  data: { name: string; value: number }[];
  dataKey?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={150}
        />
        <Tooltip {...tooltipStyle()} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey={dataKey ?? "value"} radius={[0, 6, 6, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
