"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { fetchAlerts } from "@/lib/api";
import { Alert } from "@/lib/types";
import { Bell, CheckCircle, ShieldCheck, RotateCw } from "lucide-react";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await fetchAlerts();
    setAlerts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Alert Center" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f1ff]">Alert Center</h1>
            <p className="text-xs text-[#71839e] mt-1">Raw anomaly events and threshold violations prior to incident correlation</p>
          </div>
          <button
            onClick={loadAlerts}
            className="p-1.5 rounded-lg border border-lineDark bg-[#0b1220]/60 text-cyberCyan hover:bg-cyberCyan/10 transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="card-glass p-6 space-y-4">
          {alerts.length === 0 ? (
            <div className="text-center py-12 text-[#71839e] space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-cyberGreen" />
              <p className="text-xs text-[#a4b8d1]">Zero Active Alerts</p>
              <p className="text-[10px]">All telemetry streams are operating within established safe threshold boundaries.</p>
            </div>
          ) : (
            <div className="divide-y divide-lineDark/60">
              {alerts.map((al) => (
                <div key={al.id} className="py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        al.severity === "CRITICAL"
                          ? "bg-cyberRed/20 text-cyberRed border border-cyberRed/30"
                          : al.severity === "WARNING"
                          ? "bg-cyberYellow/20 text-cyberYellow border border-cyberYellow/30"
                          : "bg-cyberCyan/20 text-cyberCyan border border-cyberCyan/30"
                      }`}>
                        {al.severity}
                      </span>
                      <b className="text-sm text-[#e8f1ff]">{al.title}</b>
                      <span className="text-[10px] text-[#71839e]">
                        Host: <b className="text-[#a4b8d1]">{al.serverName}</b>
                      </span>
                    </div>
                    <p className="text-xs text-[#71839e]">{al.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#71839e] font-mono">{al.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
