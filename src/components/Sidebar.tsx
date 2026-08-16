"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Rocket,
  Grid3x3,
  LineChart,
  Activity,
  Type,
  Image as ImageIcon,
  ListVideo,
  Lightbulb,
  Calendar,
  FlaskConical,
  Bot,
  FileText,
  Megaphone,
  Settings as SettingsIcon,
  Gauge,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/mission-control", label: "Mission Control", icon: Rocket },
  { href: "/video-lab", label: "Video Lab", icon: Grid3x3 },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/retention", label: "Retention", icon: Activity },
  { href: "/title-lab", label: "Title Lab", icon: Type },
  { href: "/thumbnail-lab", label: "Thumbnail Lab", icon: ImageIcon },
  { href: "/playlists", label: "Playlists", icon: ListVideo },
  { href: "/ideas", label: "Content Ideas", icon: Lightbulb },
  { href: "/calendar", label: "Content Calendar", icon: Calendar },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/promotion", label: "Promotion", icon: Megaphone },
  { href: "/strategist", label: "AI Strategist", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-bg-soft md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
          <Gauge className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-ink">Watch-Time</div>
          <div className="text-xs text-ink-dim">Accelerator</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand/10 font-medium text-ink shadow-[inset_2px_0_0_0_#ff2d55]"
                  : "text-ink-soft hover:bg-bg-hover hover:text-ink"
              )}
            >
              <Icon className={clsx("h-[18px] w-[18px]", active && "text-brand")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-3 text-[11px] leading-relaxed text-ink-dim">
        Legitimate growth only. No bots, no fake views, ever.
      </div>
    </aside>
  );
}
