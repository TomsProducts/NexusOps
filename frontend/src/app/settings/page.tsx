"use client";

import { useState } from "react";
import Topbar from "@/components/Topbar";
import { Shield, Sliders, Building2, BellRing } from "lucide-react";

export default function SettingsPage() {
  const [autonomyMode, setAutonomyMode] = useState("ASSIST");

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Settings & Policies" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#e8f1ff]">Platform Settings</h1>
          <p className="text-xs text-[#71839e] mt-1">Tenant policies, AI autonomy guardrails, and notification channels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Autonomy Guardrails */}
          <div className="card-glass p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#e8f1ff] flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyberCyan" /> AI Autonomy Level
            </h2>
            <p className="text-xs text-[#71839e]">
              Control how much authority the AI Operations Engine has over automated remediations.
            </p>

            <div className="space-y-3">
              {[
                {
                  mode: "OBSERVE",
                  title: "Observe Mode",
                  desc: "AI only generates root-cause analyses and recommendations. No remediation commands are executed automatically.",
                },
                {
                  mode: "ASSIST",
                  title: "Assist Mode (Recommended)",
                  desc: "AI proposes typed safe actions. Operator approval is required before execution. High-risk actions always require human sign-off.",
                },
                {
                  mode: "AUTONOMOUS",
                  title: "Autonomous Mode",
                  desc: "Strictly allowlisted safe actions (e.g. log rotation, temp cleanup) execute automatically. Moderate and high-risk actions still require approval.",
                },
              ].map((item) => (
                <label
                  key={item.mode}
                  onClick={() => setAutonomyMode(item.mode)}
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    autonomyMode === item.mode
                      ? "border-cyberCyan/60 bg-cyberCyan/[0.06] shadow-[0_0_15px_rgba(25,217,255,0.1)]"
                      : "border-lineDark bg-[#060c18] hover:border-[#2a4060]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <b className="text-xs text-[#e8f1ff]">{item.title}</b>
                    <input
                      type="radio"
                      name="autonomy"
                      checked={autonomyMode === item.mode}
                      onChange={() => setAutonomyMode(item.mode)}
                      className="accent-cyberCyan"
                    />
                  </div>
                  <p className="text-[11px] text-[#71839e] mt-1.5 leading-relaxed">{item.desc}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Organization & Subscription */}
          <div className="space-y-6">
            <div className="card-glass p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#e8f1ff] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyberGreen" /> Organization Profile
              </h2>
              <div className="text-xs text-[#71839e] space-y-3">
                <div className="flex justify-between py-2 border-b border-lineDark">
                  <span>Organization Name</span>
                  <b className="text-[#e8f1ff]">ACME Systems Inc</b>
                </div>
                <div className="flex justify-between py-2 border-b border-lineDark">
                  <span>Tenant Slug</span>
                  <code className="text-cyberCyan">acme-systems</code>
                </div>
                <div className="flex justify-between py-2 border-b border-lineDark">
                  <span>Active Subscription</span>
                  <b className="text-cyberGreen">Business Tier (Up to 50 Servers)</b>
                </div>
              </div>
            </div>

            <div className="card-glass p-6 space-y-4">
              <h2 className="text-sm font-bold text-[#e8f1ff] flex items-center gap-2">
                <BellRing className="w-4 h-4 text-cyberYellow" /> Notification Channels
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-[#060c18] rounded-lg border border-lineDark">
                  <div>
                    <b className="text-[#e8f1ff] block">Critical Incidents Push</b>
                    <small className="text-[#71839e]">Android push notifications & SMS alerts</small>
                  </div>
                  <span className="text-cyberGreen font-bold text-[10px]">ENABLED</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-[#060c18] rounded-lg border border-lineDark">
                  <div>
                    <b className="text-[#e8f1ff] block">AI Action Executions</b>
                    <small className="text-[#71839e]">Audit emails on every remediation</small>
                  </div>
                  <span className="text-cyberGreen font-bold text-[10px]">ENABLED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
