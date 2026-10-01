"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Server, 
  AlertTriangle, 
  Bot, 
  Wrench, 
  Bell, 
  FileText, 
  Settings 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Servers Fleet", href: "/servers", icon: Server },
    { name: "Incidents", href: "/incidents", icon: AlertTriangle, badge: "01" },
    { name: "AI Assistant", href: "/ai", icon: Bot },
    { name: "Remediation", href: "/actions", icon: Wrench, badge: "02" },
    { name: "Alert Center", href: "/alerts", icon: Bell },
    { name: "Audit Trail", href: "/audit", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-[245px] shrink-0 border-r border-lineDark bg-[rgba(5,10,19,0.85)] backdrop-blur-md p-5 sticky top-0 h-screen flex flex-col justify-between z-20">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 pb-6 border-b border-lineDark">
          <div className="w-[34px] h-[34px] border border-cyberCyan/60 rounded-lg flex items-center justify-center text-cyberCyan shadow-[0_0_20px_rgba(25,217,255,0.2)] font-black text-sm">
            NX
          </div>
          <div>
            <b className="text-base tracking-[2px] text-[#e8f1ff] font-bold block leading-none">NEXUSOPS</b>
            <small className="text-cyberCyan text-[8px] tracking-[2px] mt-1 block uppercase">AI IT Operations</small>
          </div>
        </div>

        {/* Section Label */}
        <div className="text-[9px] text-[#50627d] tracking-[1.6px] px-3 pt-4 pb-2 uppercase font-semibold">
          Platform
        </div>

        {/* Navigation */}
        <nav className="grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 text-xs transition-all ${
                  isActive
                    ? "bg-cyberCyan/[0.08] border border-cyberCyan/20 text-[#e8f8ff] shadow-[inset_3px_0_0_#19d9ff]"
                    : "text-[#8da0bb] hover:bg-cyberCyan/[0.04] hover:text-[#e8f1ff] border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-cyberCyan" : "text-[#5f7898]"}`} />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-cyberRed/20 text-cyberRed font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Organization footer */}
      <div className="border-t border-lineDark pt-4 px-2 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#23436c] to-[#16263f] flex items-center justify-center text-xs text-[#9fdfff] font-bold">
          AC
        </div>
        <div className="min-w-0">
          <strong className="text-xs text-[#e8f1ff] block truncate">ACME Systems</strong>
          <small className="text-[#71839e] text-[10px] block">Business Plan</small>
        </div>
      </div>
    </aside>
  );
}
