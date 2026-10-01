"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import { fetchActions, approveAction, fetchServers, proposeAction } from "@/lib/api";
import { Action, Server } from "@/lib/types";
import { Wrench, CheckCircle, ShieldAlert, Play, RotateCw, Activity } from "lucide-react";

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedActionType, setSelectedActionType] = useState<string>("COLLECT_DIAGNOSTICS");
  const [dispatching, setDispatching] = useState(false);

  const loadData = async () => {
    const [acts, srvs] = await Promise.all([fetchActions(), fetchServers()]);
    setActions(acts);
    setServers(srvs);
    if (srvs.length > 0 && !selectedServer) {
      setSelectedServer(srvs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (actionId: string) => {
    setProcessingId(actionId);
    await approveAction(actionId);
    setTimeout(() => {
      loadData();
      setProcessingId(null);
    }, 600);
  };

  const handleDispatch = async () => {
    if (!selectedServer || dispatching) return;
    setDispatching(true);
    await proposeAction(selectedServer, selectedActionType, JSON.stringify({ triggered_by: "Console Operator" }));
    setShowDispatchModal(false);
    setDispatching(false);
    loadData();
  };

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Remediation Actions" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f1ff]">Remediation Actions</h1>
            <p className="text-xs text-[#71839e] mt-1">Policy-controlled operational interventions with verification logs</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDispatchModal(true)}
              disabled={servers.length === 0}
              className="bg-cyberCyan hover:bg-cyberCyan/90 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(25,217,255,0.3)] flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              + Dispatch Diagnostic Task
            </button>
            <button
              onClick={loadData}
              className="p-2 rounded-lg border border-lineDark bg-[#0b1220]/60 text-cyberCyan hover:bg-cyberCyan/10 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="card-glass p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#e8f1ff] mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyberCyan" /> Action Queue & Approvals
          </h2>

          {actions.length === 0 ? (
            <div className="text-center py-12 text-[#71839e] space-y-2">
              <Activity className="w-8 h-8 mx-auto text-[#455b77]" />
              <p className="text-xs text-[#a4b8d1]">No operational actions pending or running.</p>
              <p className="text-[10px]">Click "+ Dispatch Diagnostic Task" above to run an allowlisted diagnostic runbook on any server.</p>
            </div>
          ) : (
            <div className="divide-y divide-lineDark/60">
              {actions.map((act) => (
                <div key={act.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <b className="text-sm text-[#e8f1ff]">{act.actionType}</b>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                        act.riskLevel === "SAFE"
                          ? "bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30"
                          : "bg-cyberRed/20 text-cyberRed border border-cyberRed/30"
                      }`}>
                        {act.riskLevel}
                      </span>
                      <span className="text-[10px] text-[#71839e]">
                        Host: <b className="text-[#a4b8d1]">{act.serverName}</b> {act.incidentNumber && `· ${act.incidentNumber}`}
                      </span>
                    </div>
                    <p className="text-xs text-[#71839e]">
                      Parameters: <code className="bg-[#050b16] px-1.5 py-0.5 rounded text-cyberCyan">{act.parameters}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      act.status === "APPROVED" || act.status === "VERIFIED" || act.status === "COMPLETED" ? "text-cyberGreen" : "text-cyberYellow"
                    }`}>
                      {act.status}
                    </span>

                    {act.status === "PROPOSED" && (
                      <button
                        onClick={() => handleApprove(act.id)}
                        disabled={processingId === act.id}
                        className="bg-cyberCyan hover:bg-cyberCyan/90 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(25,217,255,0.3)] flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve & Execute
                      </button>
                    )}

                    {act.status === "APPROVED" && (
                      <span className="text-xs text-cyberGreen flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Ready for Agent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-glass p-5 flex items-start gap-3 border-cyberYellow/30">
          <ShieldAlert className="w-5 h-5 text-cyberYellow shrink-0 mt-0.5" />
          <div className="text-xs text-[#a4b8d1] space-y-1">
            <b className="text-cyberYellow block">Zero Arbitrary Shell Guarantee</b>
            <p>
              NexusOps forbids arbitrary remote shell execution. Every action is strictly typed, schema-validated, allowlisted by agent policy, executed with local process timeouts, and verified post-run.
            </p>
          </div>
        </div>

        {/* Dispatch Modal */}
        {showDispatchModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-glass p-6 max-w-md w-full border-cyberCyan/40 space-y-4">
              <h2 className="text-base font-bold text-[#e8f1ff]">Dispatch Allowlisted Action</h2>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] text-[#71839e] uppercase mb-1">Target Server</label>
                  <select
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                    className="w-full bg-[#050b16] border border-lineDark rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyberCyan"
                  >
                    {servers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({s.ipAddress})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-[#71839e] uppercase mb-1">Action Type</label>
                  <select
                    value={selectedActionType}
                    onChange={(e) => setSelectedActionType(e.target.value)}
                    className="w-full bg-[#050b16] border border-lineDark rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyberCyan"
                  >
                    <option value="COLLECT_DIAGNOSTICS">COLLECT_DIAGNOSTICS (Safe · Collect process & resource breakdown)</option>
                    <option value="DOCKER_LIST_CONTAINERS">DOCKER_LIST_CONTAINERS (Safe · List Docker containers)</option>
                    <option value="GET_PROCESS_LIST">GET_PROCESS_LIST (Safe · Query system processes)</option>
                    <option value="GET_CRITICAL_LOGS">GET_CRITICAL_LOGS (Safe · Fetch critical journal/kernel logs)</option>
                    <option value="CHECK_SERVICE_STATUS">CHECK_SERVICE_STATUS (Safe · Systemd unit check)</option>
                    <option value="ROTATE_LOGS">ROTATE_LOGS (Safe · Trigger logrotate on system)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDispatchModal(false)}
                  className="border border-lineDark hover:bg-white/5 text-[#e8f1ff] px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDispatch}
                  disabled={dispatching}
                  className="bg-cyberCyan hover:bg-cyberCyan/90 text-black px-4 py-2 rounded-lg text-xs font-bold"
                >
                  {dispatching ? "Dispatching..." : "Submit Proposal"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
