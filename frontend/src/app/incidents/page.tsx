"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { fetchIncidents } from "@/lib/api";
import { Incident } from "@/lib/types";
import { ShieldCheck, Cpu, AlertCircle, RotateCw } from "lucide-react";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIncidents = async () => {
    setLoading(true);
    const data = await fetchIncidents();
    setIncidents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Incident Command" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f1ff]">Incident Command Center</h1>
            <p className="text-xs text-[#71839e] mt-1">Real-time correlated alerts with 9Router AI root cause analysis</p>
          </div>
          <button
            onClick={loadIncidents}
            className="p-1.5 rounded-lg border border-lineDark bg-[#0b1220]/60 text-cyberCyan hover:bg-cyberCyan/10 transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {incidents.length === 0 ? (
          <div className="card-glass p-8 border-cyberGreen/30 shadow-[0_0_20px_rgba(5,223,114,0.1)] flex flex-col items-center justify-center text-center space-y-3 py-16">
            <div className="w-14 h-14 rounded-2xl bg-cyberGreen/10 border border-cyberGreen/30 flex items-center justify-center text-cyberGreen shadow-[0_0_20px_rgba(5,223,114,0.2)]">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-[#e8f1ff]">All Production Systems Operational</h2>
            <p className="text-xs text-[#a4b8d1] max-w-md leading-relaxed">
              Zero active critical or warning incidents detected across the monitored fleet. 9Router AI is observing live telemetry streams.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyberGreen/10 border border-cyberGreen/30 text-[10px] text-cyberGreen font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyberGreen animate-ping" />
              Real-time Ingestion Active
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              {incidents.map((inc) => (
                <div key={inc.id} className="card-glass p-6 border-l-4 border-l-cyberRed space-y-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-cyberRed tracking-wider uppercase bg-cyberRed/20 px-2 py-0.5 rounded">
                        {inc.severity} · {inc.status}
                      </span>
                      <h2 className="text-lg font-bold text-[#e8f1ff] mt-2">
                        {inc.incidentNumber} · {inc.title}
                      </h2>
                      <small className="text-[#6d829e] text-[11px] block mt-0.5">
                        Target Host: <b className="text-cyberCyan">{inc.primaryServerName}</b>
                      </small>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyberPurple/[0.08] to-cyberCyan/[0.05] border border-cyberPurple/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-cyberCyan flex items-center gap-1.5">
                        <Cpu className="w-4 h-4" /> Incident Summary
                      </span>
                    </div>
                    <p className="text-xs text-[#dce7f5] leading-relaxed">
                      {inc.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
