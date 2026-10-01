"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import { fetchDashboardSummary, approveAction } from "@/lib/api";
import { DashboardSummary } from "@/lib/types";
import { 
  Bot, 
  CheckCircle2, 
  RotateCw, 
  ExternalLink,
  Server as ServerIcon,
  ShieldCheck,
  Cpu,
  Activity
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [timeRange, setTimeRange] = useState("24h");
  const [approvedActionId, setApprovedActionId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setRefreshing(true);
    const summary = await fetchDashboardSummary();
    setData(summary);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (actionId: string) => {
    setApprovedActionId(actionId);
    await approveAction(actionId);
    setTimeout(() => {
      loadData();
    }, 600);
  };

  if (!data) {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar breadcrumb="Overview" />
        <div className="p-8 flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-2 border-cyberCyan border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Overview" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-5">
        {/* Page Head */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#e8f1ff]">Infrastructure Fleet</h1>
            <p className="text-xs text-[#71839e] mt-1">Autonomous monitoring, telemetry correlation, and guided remediation</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-lineDark bg-[#0b1220]/60 text-cyberCyan hover:bg-cyberCyan/10 transition-colors"
              title="Refresh Telemetry"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <div className="flex gap-1 border border-lineDark rounded-lg p-0.5 bg-[#0b1220]/60">
              {["1h", "6h", "24h", "7d"].map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                    timeRange === r
                      ? "bg-cyberCyan/[0.12] border border-cyberCyan/40 text-cyberCyan"
                      : "text-[#72849e] hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Health */}
          <div className="card-glass p-4 relative overflow-hidden">
            <span className="text-[9px] text-[#687d99] tracking-wider uppercase font-semibold">System Health</span>
            <div className="text-2xl font-bold text-cyberGreen mt-1.5">{data.systemHealth}/100</div>
            <div className="text-[10px] text-cyberGreen mt-1">● Fleet Operational</div>
          </div>

          {/* Servers */}
          <div className="card-glass p-4 relative overflow-hidden">
            <span className="text-[9px] text-[#687d99] tracking-wider uppercase font-semibold">Live Servers</span>
            <div className="text-2xl font-bold text-[#e8f1ff] mt-1.5">{data.totalServers}</div>
            <div className="text-[10px] text-cyberGreen mt-1">{data.healthyServers} healthy</div>
          </div>

          {/* Critical */}
          <div className="card-glass p-4 relative overflow-hidden">
            <span className="text-[9px] text-[#687d99] tracking-wider uppercase font-semibold">Critical</span>
            <div className={`text-2xl font-bold mt-1.5 ${data.criticalServers > 0 ? "text-cyberRed" : "text-[#71839e]"}`}>
              0{data.criticalServers}
            </div>
            <div className="text-[10px] text-[#71839e] mt-1">
              {data.criticalServers > 0 ? "requires attention" : "zero active"}
            </div>
          </div>

          {/* Warnings */}
          <div className="card-glass p-4 relative overflow-hidden">
            <span className="text-[9px] text-[#687d99] tracking-wider uppercase font-semibold">Warnings</span>
            <div className={`text-2xl font-bold mt-1.5 ${data.warningServers > 0 ? "text-cyberYellow" : "text-[#71839e]"}`}>
              0{data.warningServers}
            </div>
            <div className="text-[10px] text-[#71839e] mt-1">
              {data.warningServers > 0 ? "warning alert" : "within threshold"}
            </div>
          </div>

          {/* AI Autonomy */}
          <div className="card-glass p-4 relative overflow-hidden">
            <span className="text-[9px] text-[#687d99] tracking-wider uppercase font-semibold">AI Engine</span>
            <div className="text-2xl font-bold text-cyberCyan mt-1.5">9ROUTER</div>
            <div className="text-[10px] text-cyberCyan/80 mt-1">ag/gemini-3.8-flash</div>
          </div>

          {/* Incidents */}
          <div className="card-glass p-4 relative overflow-hidden">
            <span className="text-[9px] text-[#687d99] tracking-wider uppercase font-semibold">Active Incidents</span>
            <div className="text-2xl font-bold text-[#e8f1ff] mt-1.5">{data.openIncidentsCount}</div>
            <div className="text-[10px] text-cyberGreen mt-1">
              {data.openIncidentsCount === 0 ? "clean queue" : `${data.openIncidentsCount} open`}
            </div>
          </div>
        </div>

        {/* Main Grid: Left (Topology & Fleet) / Right (AI Assistant & Alerts) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Real Infrastructure Topology */}
            <div className="card-glass p-5">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-[#e8f1ff]">Live Enrolled Infrastructure</h3>
                  <p className="text-[10px] text-[#60748f]">Local Area Network Subnet 192.168.68.0/24 · Real Hardware Telemetry</p>
                </div>
                <Link href="/servers" className="text-[10px] text-cyberCyan flex items-center gap-1 hover:underline">
                  Manage Fleet ({data.servers.length}) <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Dynamic Topology Grid */}
              {data.servers.length === 0 ? (
                <div className="h-44 rounded-lg border border-lineDark bg-[#060c18] flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <ServerIcon className="w-8 h-8 text-[#71839e]" />
                  <p className="text-xs text-[#a4b8d1]">No servers currently enrolled.</p>
                  <p className="text-[10px] text-[#71839e]">Run the NexusOps Agent on any Linux server to begin real-time telemetry streaming.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {data.servers.map((s) => (
                    <div 
                      key={s.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        s.status === "CRITICAL"
                          ? "bg-cyberRed/[0.06] border-cyberRed/40 shadow-[0_0_15px_rgba(255,77,109,0.15)]"
                          : s.status === "WARNING"
                          ? "bg-cyberYellow/[0.06] border-cyberYellow/40"
                          : "bg-[#07101e]/80 border-cyberCyan/30 shadow-[0_0_15px_rgba(25,217,255,0.06)]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              s.status === "CRITICAL" ? "bg-cyberRed animate-pulse" : s.status === "WARNING" ? "bg-cyberYellow" : "bg-cyberGreen"
                            }`} />
                            <b className="text-sm text-[#e8f1ff]">{s.displayName}</b>
                          </div>
                          <small className="text-[10px] text-[#6f849f] block mt-0.5">{s.ipAddress} · {s.hostname}</small>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          s.status === "CRITICAL" ? "bg-cyberRed/20 text-cyberRed" : s.status === "WARNING" ? "bg-cyberYellow/20 text-cyberYellow" : "bg-cyberGreen/20 text-cyberGreen"
                        }`}>
                          {s.status}
                        </span>
                      </div>

                      {/* Hardware Resource Indicators */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-lineDark text-center">
                        <div className="p-1.5 bg-[#050b16] rounded border border-lineDark">
                          <span className="text-[8px] text-[#6f849f] block">CPU</span>
                          <b className="text-xs text-cyberCyan">{s.currentCpu ?? "--"}%</b>
                        </div>
                        <div className="p-1.5 bg-[#050b16] rounded border border-lineDark">
                          <span className="text-[8px] text-[#6f849f] block">RAM</span>
                          <b className="text-xs text-cyberPurple">{s.currentMemory ?? "--"}%</b>
                        </div>
                        <div className="p-1.5 bg-[#050b16] rounded border border-lineDark">
                          <span className="text-[8px] text-[#6f849f] block">DISK</span>
                          <b className={`text-xs ${(s.currentDisk ?? 0) >= 90 ? "text-cyberRed font-bold" : "text-[#e8f1ff]"}`}>
                            {s.currentDisk ?? "--"}%
                          </b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Server Fleet List */}
            <div className="card-glass p-5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-semibold tracking-wide text-[#e8f1ff]">Live Fleet Status</h3>
                <Link href="/servers" className="text-[10px] text-cyberCyan hover:underline">
                  View Full Metrics ({data.servers.length}) →
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-lineDark text-[#60748f] text-[9px] uppercase tracking-wider">
                      <th className="pb-2.5">Server Name</th>
                      <th className="pb-2.5">IP Address</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">CPU</th>
                      <th className="pb-2.5">Memory</th>
                      <th className="pb-2.5">Disk</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lineDark/60">
                    {data.servers.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 font-semibold text-[#e8f1ff]">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            s.status === "CRITICAL" ? "bg-cyberRed" : s.status === "WARNING" ? "bg-cyberYellow" : "bg-cyberGreen"
                          }`} />
                          {s.displayName}
                        </td>
                        <td className="py-3 text-[#71839e] text-[11px] font-mono">{s.ipAddress}</td>
                        <td className="py-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                            s.status === "CRITICAL"
                              ? "bg-cyberRed/20 text-cyberRed border border-cyberRed/30"
                              : s.status === "WARNING"
                              ? "bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30"
                              : "bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30"
                          }`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 text-cyberCyan font-semibold">{s.currentCpu ?? "--"}%</td>
                        <td className="py-3 text-cyberPurple font-semibold">{s.currentMemory ?? "--"}%</td>
                        <td className={`py-3 font-semibold ${
                          (s.currentDisk ?? 0) >= 90 ? "text-cyberRed font-bold" : "text-[#a5bad4]"
                        }`}>
                          {s.currentDisk ?? "--"}%
                        </td>
                        <td className="py-3 text-right">
                          <Link href={`/servers`} className="text-cyberCyan hover:underline text-[10px]">
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {data.servers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-[#71839e] text-xs">
                          No servers connected yet. Start an agent to stream live telemetry.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) - AI & Incident Focus */}
          <div className="lg:col-span-4 space-y-4">
            {/* AI Operations Spotlight */}
            <div className="card-glass p-5 border-cyberCyan/40 shadow-[0_0_25px_rgba(25,217,255,0.12)]">
              <div className="flex items-center justify-between pb-3 border-b border-lineDark">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyberCyan" />
                  <span className="text-xs font-bold text-cyberCyan tracking-wide">AI OPERATIONS ENGINE</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyberCyan/20 text-cyberCyan border border-cyberCyan/40 font-semibold">
                  ONLINE
                </span>
              </div>

              <div className="mt-3.5 space-y-3">
                {data.activeIncidents.length > 0 ? (
                  data.activeIncidents.map((inc) => (
                    <div key={inc.id} className="p-3 rounded-lg bg-cyberRed/[0.08] border-l-4 border-cyberRed space-y-1">
                      <div className="text-[11px] font-bold text-cyberRed">
                        {inc.incidentNumber} · {inc.title}
                      </div>
                      <p className="text-[10px] text-[#dce6f5] leading-relaxed">
                        {inc.summary}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-cyberGreen/[0.08] border-l-4 border-cyberGreen flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-cyberGreen shrink-0 mt-0.5" />
                    <div>
                      <b className="text-xs text-cyberGreen block">Autonomous Fleet Health Normal</b>
                      <p className="text-[10px] text-[#a4b8d1] mt-0.5">
                        9Router AI is actively correlating live telemetry from {data.servers.map(s => s.displayName).join(", ") || "connected hosts"}. All system metrics are within safety boundaries.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-lineDark flex justify-between items-center text-xs">
                  <span className="text-[10px] text-[#6d829e]">AI Gateway Provider</span>
                  <span className="text-[10px] text-cyberCyan font-bold">9Router (:20128)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] text-[#6d829e]">Active Model</span>
                  <span className="text-[10px] text-[#e8f1ff] font-mono">ag/gemini-3.8-flash</span>
                </div>

                <div className="pt-2">
                  <Link
                    href="/ai"
                    className="w-full bg-cyberCyan/15 hover:bg-cyberCyan/25 text-cyberCyan border border-cyberCyan/40 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(25,217,255,0.15)]"
                  >
                    <Bot className="w-3.5 h-3.5" /> Open AI Assistant Console →
                  </Link>
                </div>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="card-glass p-5">
              <div className="flex justify-between items-center pb-2.5 border-b border-lineDark">
                <h3 className="text-xs font-bold text-[#e8f1ff]">Pending Approvals</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyberYellow/20 text-cyberYellow">
                  {data.pendingActions.length} Pending
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {data.pendingActions.map((act) => (
                  <div key={act.id} className="p-3 bg-[#060c18] rounded-lg border border-lineDark space-y-1.5">
                    <div className="flex justify-between items-center">
                      <b className="text-xs text-[#e8f1ff]">{act.actionType}</b>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                        act.riskLevel === "SAFE" ? "bg-cyberGreen/20 text-cyberGreen" : "bg-cyberRed/20 text-cyberRed"
                      }`}>
                        {act.riskLevel}
                      </span>
                    </div>
                    <small className="text-[#6d829e] text-[9px] block">
                      Target Host: <b className="text-[#a4b8d1]">{act.serverName}</b>
                    </small>
                    <button
                      onClick={() => handleApprove(act.id)}
                      disabled={approvedActionId === act.id}
                      className="w-full mt-1 bg-cyberCyan hover:bg-cyberCyan/90 text-black py-1.5 rounded text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Approve Action
                    </button>
                  </div>
                ))}
                {data.pendingActions.length === 0 && (
                  <p className="text-xs text-[#71839e] text-center py-4">No actions awaiting operator approval.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
