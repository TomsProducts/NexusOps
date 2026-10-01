"use client";

import Link from "next/link";

interface TopbarProps {
  breadcrumb?: string;
}

export default function Topbar({ breadcrumb = "Infrastructure Overview" }: TopbarProps) {
  return (
    <header className="h-[70px] border-b border-lineDark flex items-center justify-between px-7 bg-[rgba(5,10,19,0.55)] backdrop-blur-md sticky top-0 z-10">
      <div className="text-xs text-[#71839e]">
        Production Fleet / <b className="text-[#dce9fa] font-semibold">{breadcrumb}</b>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] text-cyberGreen font-medium mr-2">
          <div className="w-2 h-2 rounded-full bg-cyberGreen dot-pulse" />
          <span>LIVE TELEMETRY</span>
        </div>

        <Link
          href="/servers"
          className="border border-lineDark bg-[#0d1625]/80 hover:border-[#315273] hover:text-white text-[#8da0bb] rounded-md h-8 px-3 text-[11px] font-medium flex items-center transition-all"
        >
          + Enroll Agent
        </Link>

        <Link
          href="/settings"
          className="border border-cyberCyan/30 bg-cyberCyan/[0.08] hover:bg-cyberCyan/15 text-cyberCyan rounded-md h-8 px-3 text-[11px] font-medium flex items-center transition-all shadow-[0_0_12px_rgba(25,217,255,0.1)]"
        >
          Autonomy: ASSIST
        </Link>
      </div>
    </header>
  );
}
