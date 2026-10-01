"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { fetchAuditLogs } from "@/lib/api";
import { FileText, Shield, RotateCw } from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Audit Trail" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f1ff]">Audit Trail</h1>
            <p className="text-xs text-[#71839e] mt-1">Immutable, tenant-scoped record of all operational and security actions</p>
          </div>
          <button
            onClick={loadLogs}
            className="p-1.5 rounded-lg border border-lineDark bg-[#0b1220]/60 text-cyberCyan hover:bg-cyberCyan/10 transition-colors"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="card-glass p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-[#71839e]">
              <FileText className="w-8 h-8 mx-auto text-[#455b77] mb-2" />
              <p className="text-xs text-[#a4b8d1]">No audit logs recorded yet.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-lineDark text-[#60748f] text-[9px] uppercase tracking-wider">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Actor Type</th>
                  <th className="pb-3">Event Type</th>
                  <th className="pb-3">Target Resource</th>
                  <th className="pb-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lineDark/60">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-[#71839e] text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 font-semibold text-[#e8f1ff]">{log.actorType}</td>
                    <td className="py-3">
                      <span className="bg-cyberCyan/10 text-cyberCyan px-2 py-0.5 rounded font-mono text-[10px]">
                        {log.eventType}
                      </span>
                    </td>
                    <td className="py-3 text-[#a4b8d1]">{log.resourceType} {log.resourceId && `· ${log.resourceId.slice(0, 8)}`}</td>
                    <td className="py-3 font-mono text-[10px] text-[#6d829e] truncate max-w-xs">{log.metadata}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
