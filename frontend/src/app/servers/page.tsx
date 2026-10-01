"use client";

import { useEffect, useState, useMemo } from "react";
import Topbar from "@/components/Topbar";
import { fetchServers, fetchContainerLogs, restartDockerContainer } from "@/lib/api";
import { Server, DockerContainerInfo, ProcessInfo, SystemLogEntry } from "@/lib/types";
import {
  Copy,
  Check,
  Terminal,
  Boxes,
  Activity,
  FileText,
  RotateCw,
  Search,
  AlertTriangle,
  Cpu,
  Eye,
  RefreshCw,
  X,
  Server as ServerIcon,
  Play,
  CheckCircle2,
  HardDrive
} from "lucide-react";

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [activeTab, setActiveTab] = useState<"docker" | "processes" | "logs">("docker");
  
  // Search & filter states
  const [dockerSearch, setDockerSearch] = useState("");
  const [procSearch, setProcSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");
  
  // Docker logs modal
  const [inspectContainer, setInspectContainer] = useState<string | null>(null);
  const [containerLogs, setContainerLogs] = useState<string | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [restartingContainer, setRestartingContainer] = useState<string | null>(null);
  const [restartMessage, setRestartMessage] = useState<string | null>(null);
  const [copiedLog, setCopiedLog] = useState(false);

  // Enroll modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const loadServers = async () => {
    const list = await fetchServers();
    setServers(list);
    if (selectedServer) {
      const refreshed = list.find((s) => s.id === selectedServer.id);
      if (refreshed) {
        setSelectedServer(refreshed);
      }
    }
  };

  useEffect(() => {
    loadServers();
    const interval = setInterval(loadServers, 8000);
    return () => clearInterval(interval);
  }, [selectedServer?.id]);

  // Parse server JSON payloads safely
  const parsedContainers: DockerContainerInfo[] = useMemo(() => {
    if (!selectedServer?.dockerContainers) return [];
    try {
      return JSON.parse(selectedServer.dockerContainers);
    } catch {
      return [];
    }
  }, [selectedServer?.dockerContainers]);

  const parsedProcesses: ProcessInfo[] = useMemo(() => {
    if (!selectedServer?.topProcesses) return [];
    try {
      return JSON.parse(selectedServer.topProcesses);
    } catch {
      return [];
    }
  }, [selectedServer?.topProcesses]);

  const parsedLogs: SystemLogEntry[] = useMemo(() => {
    if (!selectedServer?.criticalLogs) return [];
    try {
      return JSON.parse(selectedServer.criticalLogs);
    } catch {
      return [];
    }
  }, [selectedServer?.criticalLogs]);

  // Filtered views
  const filteredContainers = useMemo(() => {
    return parsedContainers.filter((c) => {
      const q = dockerSearch.toLowerCase();
      const names = (c.names || []).join(" ").toLowerCase();
      const image = (c.image || "").toLowerCase();
      return names.includes(q) || image.includes(q);
    });
  }, [parsedContainers, dockerSearch]);

  const filteredProcesses = useMemo(() => {
    return parsedProcesses.filter((p) => {
      const q = procSearch.toLowerCase();
      return (
        p.command.toLowerCase().includes(q) ||
        p.user.toLowerCase().includes(q) ||
        String(p.pid).includes(q)
      );
    });
  }, [parsedProcesses, procSearch]);

  const filteredLogs = useMemo(() => {
    return parsedLogs.filter((l) => {
      const q = logSearch.toLowerCase();
      return (
        l.message.toLowerCase().includes(q) ||
        l.unit.toLowerCase().includes(q) ||
        l.priority.toLowerCase().includes(q)
      );
    });
  }, [parsedLogs, logSearch]);

  const handleOpenLogs = async (containerName: string) => {
    if (!selectedServer) return;
    setInspectContainer(containerName);
    setContainerLogs(null);
    setLoadingLogs(true);
    const logs = await fetchContainerLogs(selectedServer.id, containerName, 120);
    setContainerLogs(logs);
    setLoadingLogs(false);
  };

  const handleRestartContainer = async (containerName: string) => {
    if (!selectedServer) return;
    if (!confirm(`Are you sure you want to restart container '${containerName}'?`)) return;
    setRestartingContainer(containerName);
    setRestartMessage(null);
    const result = await restartDockerContainer(selectedServer.id, containerName);
    setRestartingContainer(null);
    setRestartMessage(result);
    setTimeout(() => {
      setRestartMessage(null);
      loadServers();
    }, 4000);
  };

  const handleCopyLogs = () => {
    if (!containerLogs) return;
    navigator.clipboard.writeText(containerLogs);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const installCmd = "curl -sSL http://192.168.68.117:8080/install.sh | sudo bash -s -- --token nx_enroll_general";

  return (
    <div className="flex-1 flex flex-col">
      <Topbar breadcrumb="Servers Fleet & Runtime Telemetry" />

      <main className="p-7 max-w-[1700px] w-full mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#e8f1ff]">Managed Servers</h1>
            <p className="text-xs text-[#71839e] mt-1">
              Real-time hardware status, Docker container engines, process trees, and Linux system logs
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEnrollModal(true)}
              className="bg-cyberCyan hover:bg-cyberCyan/90 text-black px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-[0_0_15px_rgba(25,217,255,0.3)] flex items-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              + Enroll New Server
            </button>
            <button
              onClick={loadServers}
              className="p-2 rounded-lg border border-lineDark bg-[#0b1220]/60 text-cyberCyan hover:bg-cyberCyan/10 transition-colors"
              title="Refresh telemetry"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Fleet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servers.map((s) => {
            const containersCount = s.dockerContainers
              ? (() => {
                  try {
                    return JSON.parse(s.dockerContainers).length;
                  } catch {
                    return 0;
                  }
                })()
              : 0;
            const procsCount = s.topProcesses
              ? (() => {
                  try {
                    return JSON.parse(s.topProcesses).length;
                  } catch {
                    return 0;
                  }
                })()
              : 0;
            const logsCount = s.criticalLogs
              ? (() => {
                  try {
                    return JSON.parse(s.criticalLogs).length;
                  } catch {
                    return 0;
                  }
                })()
              : 0;

            const isSelected = selectedServer?.id === s.id;

            return (
              <div
                key={s.id}
                onClick={() => setSelectedServer(s)}
                className={`card-glass p-5 space-y-4 cursor-pointer transition-all duration-200 hover:border-cyberCyan/50 ${
                  isSelected ? "border-cyberCyan shadow-[0_0_20px_rgba(25,217,255,0.2)] bg-[#0c1629]/90" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-[#e8f1ff] flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          s.status === "CRITICAL"
                            ? "bg-cyberRed animate-pulse"
                            : s.status === "WARNING"
                            ? "bg-cyberYellow"
                            : "bg-cyberGreen"
                        }`}
                      />
                      {s.displayName}
                    </h3>
                    <small className="text-[#657b98] text-[10px] block mt-0.5">{s.hostname}</small>
                  </div>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      s.status === "CRITICAL"
                        ? "bg-cyberRed/20 text-cyberRed"
                        : s.status === "WARNING"
                        ? "bg-cyberYellow/20 text-cyberYellow"
                        : "bg-cyberGreen/20 text-cyberGreen"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>

                <div className="text-[11px] text-[#71839e] space-y-1">
                  <div className="flex justify-between">
                    <span>IP Address:</span> <b className="text-[#a4b8d1]">{s.ipAddress}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>OS Platform:</span> <b className="text-[#a4b8d1]">{s.osName} {s.osVersion}</b>
                  </div>
                  <div className="flex justify-between">
                    <span>Agent Version:</span> <b className="text-[#a4b8d1]">v{s.agentVersion}</b>
                  </div>
                </div>

                {/* Resource Bars */}
                <div className="space-y-2 pt-2 border-t border-lineDark">
                  <div>
                    <div className="flex justify-between text-[10px] text-[#71839e] mb-1">
                      <span>CPU Utilization</span>
                      <span className="text-[#e8f1ff] font-semibold">{s.currentCpu ?? 0}%</span>
                    </div>
                    <div className="w-full bg-[#070f1c] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyberCyan h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, s.currentCpu ?? 0)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-[#71839e] mb-1">
                      <span>Memory Utilization</span>
                      <span className="text-[#e8f1ff] font-semibold">{s.currentMemory ?? 0}%</span>
                    </div>
                    <div className="w-full bg-[#070f1c] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyberPurple h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, s.currentMemory ?? 0)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-[#71839e] mb-1">
                      <span>Disk Storage</span>
                      <span
                        className={`font-semibold ${
                          (s.currentDisk ?? 0) >= 90 ? "text-cyberRed font-bold" : "text-[#e8f1ff]"
                        }`}
                      >
                        {s.currentDisk ?? 0}%
                      </span>
                    </div>
                    <div className="w-full bg-[#070f1c] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (s.currentDisk ?? 0) >= 90 ? "bg-cyberRed" : "bg-cyberGreen"
                        }`}
                        style={{ width: `${Math.min(100, s.currentDisk ?? 0)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Capability Badges */}
                <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] bg-[#071324] border border-[#162a4a] text-cyberCyan px-2 py-0.5 rounded flex items-center gap-1">
                    <Boxes className="w-3 h-3" /> {containersCount} Containers
                  </span>
                  <span className="text-[10px] bg-[#071324] border border-[#162a4a] text-[#8ea7c9] px-2 py-0.5 rounded flex items-center gap-1">
                    <Activity className="w-3 h-3" /> {procsCount} Processes
                  </span>
                  {logsCount > 0 && (
                    <span className="text-[10px] bg-cyberRed/10 border border-cyberRed/30 text-cyberRed px-2 py-0.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {logsCount} Critical Logs
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedServer(s);
                  }}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? "bg-cyberCyan text-black"
                      : "border border-cyberCyan/40 text-cyberCyan hover:bg-cyberCyan/10"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {isSelected ? "Inspecting Server" : "Inspect Server Runtime"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Server Runtime Inspector Panel */}
        {selectedServer && (
          <div className="card-glass p-6 space-y-6 border-cyberCyan/40 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-lineDark">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyberCyan/10 border border-cyberCyan/30 rounded-xl text-cyberCyan">
                  <ServerIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#e8f1ff]">{selectedServer.displayName}</h2>
                    <span className="text-xs text-[#71839e]">({selectedServer.hostname})</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-cyberGreen/20 text-cyberGreen border border-cyberGreen/30">
                      {selectedServer.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#71839e] mt-0.5">
                    IP: <span className="text-[#a4b8d1] font-mono">{selectedServer.ipAddress}</span> · OS:{" "}
                    <span className="text-[#a4b8d1]">{selectedServer.osName} {selectedServer.osVersion}</span> · Agent:{" "}
                    <span className="text-[#a4b8d1]">v{selectedServer.agentVersion}</span>
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 bg-[#050b16] p-1 rounded-lg border border-lineDark">
                <button
                  onClick={() => setActiveTab("docker")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "docker"
                      ? "bg-cyberCyan text-black shadow-[0_0_10px_rgba(25,217,255,0.3)]"
                      : "text-[#71839e] hover:text-[#e8f1ff]"
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Docker Containers ({parsedContainers.length})
                </button>
                <button
                  onClick={() => setActiveTab("processes")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "processes"
                      ? "bg-cyberCyan text-black shadow-[0_0_10px_rgba(25,217,255,0.3)]"
                      : "text-[#71839e] hover:text-[#e8f1ff]"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Running Processes ({parsedProcesses.length})
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === "logs"
                      ? "bg-cyberCyan text-black shadow-[0_0_10px_rgba(25,217,255,0.3)]"
                      : "text-[#71839e] hover:text-[#e8f1ff]"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Critical Linux Logs ({parsedLogs.length})
                </button>
              </div>
            </div>

            {/* Restart message notification */}
            {restartMessage && (
              <div className="p-3 bg-cyberCyan/10 border border-cyberCyan/40 rounded-lg text-xs text-cyberCyan flex items-center justify-between">
                <span>{restartMessage}</span>
                <X className="w-4 h-4 cursor-pointer" onClick={() => setRestartMessage(null)} />
              </div>
            )}

            {/* TAB 1: DOCKER CONTAINERS */}
            {activeTab === "docker" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#516480]" />
                    <input
                      type="text"
                      placeholder="Search container by name or image..."
                      value={dockerSearch}
                      onChange={(e) => setDockerSearch(e.target.value)}
                      className="w-full bg-[#050b16] border border-lineDark rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e8f1ff] focus:outline-none focus:border-cyberCyan"
                    />
                  </div>
                  <span className="text-xs text-[#71839e]">
                    Showing <b className="text-cyberCyan">{filteredContainers.length}</b> of {parsedContainers.length} containers
                  </span>
                </div>

                {parsedContainers.length === 0 ? (
                  <div className="text-center py-12 text-[#71839e] space-y-2 card-glass p-8">
                    <Boxes className="w-8 h-8 mx-auto text-[#455b77]" />
                    <p className="text-xs text-[#a4b8d1]">No active Docker containers reported on this host.</p>
                    <p className="text-[10px]">
                      Ensure the Docker daemon is running and the local user has access to <code>/var/run/docker.sock</code>.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-lineDark text-[#71839e] uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Container Name</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Image</th>
                          <th className="py-2.5 px-3">Ports</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lineDark/40">
                        {filteredContainers.map((c) => {
                          const name = (c.names && c.names.length > 0 ? c.names[0] : c.id).replace(/^\//, "");
                          const isRunning = c.state === "running";
                          const ports = (c.ports || [])
                            .filter((p) => p.PublicPort)
                            .map((p) => `${p.PublicPort}:${p.PrivatePort}`)
                            .join(", ");

                          return (
                            <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 px-3 font-semibold text-[#e8f1ff]">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isRunning ? "bg-cyberGreen shadow-[0_0_8px_rgba(0,255,163,0.5)]" : "bg-[#516480]"
                                    }`}
                                  />
                                  <span className="font-mono">{name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                                    isRunning
                                      ? "bg-cyberGreen/10 text-cyberGreen border border-cyberGreen/20"
                                      : "bg-[#20334d]/40 text-[#71839e]"
                                  }`}
                                >
                                  {c.status || c.state}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[#a4b8d1] font-mono text-[11px] truncate max-w-xs">
                                {c.image}
                              </td>
                              <td className="py-3 px-3 text-[#71839e] font-mono text-[11px]">
                                {ports || "-"}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleOpenLogs(name)}
                                    className="px-2.5 py-1 rounded bg-[#0b182d] hover:bg-cyberCyan/20 text-cyberCyan border border-cyberCyan/30 text-[11px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Terminal className="w-3 h-3" />
                                    View Logs
                                  </button>
                                  <button
                                    onClick={() => handleRestartContainer(name)}
                                    disabled={restartingContainer === name}
                                    className="px-2.5 py-1 rounded bg-[#1f1015] hover:bg-cyberRed/20 text-cyberRed border border-cyberRed/30 text-[11px] font-bold transition-all flex items-center gap-1"
                                    title="Restart Container"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${restartingContainer === name ? "animate-spin" : ""}`} />
                                    Restart
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RUNNING PROCESSES */}
            {activeTab === "processes" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#516480]" />
                    <input
                      type="text"
                      placeholder="Search processes by command, user, or PID..."
                      value={procSearch}
                      onChange={(e) => setProcSearch(e.target.value)}
                      className="w-full bg-[#050b16] border border-lineDark rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e8f1ff] focus:outline-none focus:border-cyberCyan"
                    />
                  </div>
                  <span className="text-xs text-[#71839e]">
                    Top <b className="text-cyberCyan">{filteredProcesses.length}</b> sorted by CPU load
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-lineDark text-[#71839e] uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">PID</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">CPU %</th>
                        <th className="py-2.5 px-3">Mem %</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lineDark/40 font-mono">
                      {filteredProcesses.map((p, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-3 text-[#a4b8d1]">{p.pid}</td>
                          <td className="py-2.5 px-3 text-[#71839e]">{p.user}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`font-bold ${
                                p.cpu > 50
                                  ? "text-cyberRed"
                                  : p.cpu > 10
                                  ? "text-cyberYellow"
                                  : "text-cyberCyan"
                              }`}
                            >
                              {p.cpu.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-cyberPurple font-bold">
                            {p.memory.toFixed(1)}%
                          </td>
                          <td className="py-2.5 px-3 text-[#71839e]">{p.status}</td>
                          <td className="py-2.5 px-3 text-[#516480]">{p.time}</td>
                          <td className="py-2.5 px-3 text-[#e8f1ff] font-semibold truncate max-w-md">
                            {p.command}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: CRITICAL LINUX LOGS */}
            {activeTab === "logs" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#516480]" />
                    <input
                      type="text"
                      placeholder="Filter system errors..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="w-full bg-[#050b16] border border-lineDark rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#e8f1ff] focus:outline-none focus:border-cyberCyan"
                    />
                  </div>
                  <span className="text-xs text-[#71839e]">
                    Streamed from <code className="text-[#a4b8d1]">journalctl -p err..emerg</code>
                  </span>
                </div>

                {parsedLogs.length === 0 ? (
                  <div className="text-center py-12 text-[#71839e] space-y-2 card-glass p-8">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-cyberGreen" />
                    <p className="text-xs text-[#e8f1ff] font-bold">Zero Critical Errors Reported</p>
                    <p className="text-[10px]">
                      The system journal and kernel ring buffer report clean error logs in this collection cycle.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#040810] border border-lineDark rounded-xl p-4 font-mono text-xs space-y-2 max-h-[500px] overflow-y-auto">
                    {filteredLogs.map((log, idx) => (
                      <div
                        key={idx}
                        className="py-1.5 px-2.5 rounded bg-[#070e1b] hover:bg-[#0c182d] border border-lineDark/40 flex flex-col md:flex-row md:items-start gap-2 text-[11px]"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-cyberRed font-bold px-1.5 py-0.2 bg-cyberRed/10 border border-cyberRed/20 rounded text-[9px]">
                            {log.priority}
                          </span>
                          <span className="text-[#516480] text-[10px]">{log.timestamp}</span>
                          <span className="text-cyberCyan font-semibold">{log.unit}</span>
                        </div>
                        <span className="text-[#c8d8ec] break-all">{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Real-time Container Logs Modal */}
        {inspectContainer && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="card-glass max-w-4xl w-full border-cyberCyan/40 flex flex-col max-h-[85vh]">
              {/* Modal Header */}
              <div className="p-4 border-b border-lineDark flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyberCyan" />
                  <h3 className="text-sm font-bold text-[#e8f1ff]">
                    Docker Logs: <span className="text-cyberCyan font-mono">{inspectContainer}</span>
                  </h3>
                  {selectedServer && (
                    <span className="text-xs text-[#71839e]">on {selectedServer.displayName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLogs}
                    disabled={!containerLogs}
                    className="p-1.5 rounded border border-lineDark bg-[#0b1220] hover:bg-white/5 text-[#a4b8d1] text-xs transition-colors flex items-center gap-1"
                  >
                    {copiedLog ? <Check className="w-3.5 h-3.5 text-cyberGreen" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLog ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleOpenLogs(inspectContainer)}
                    disabled={loadingLogs}
                    className="p-1.5 rounded border border-lineDark bg-[#0b1220] hover:bg-white/5 text-cyberCyan text-xs transition-colors"
                    title="Refresh logs"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => {
                      setInspectContainer(null);
                      setContainerLogs(null);
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-[#71839e] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Terminal Screen */}
              <div className="p-4 bg-[#02050b] flex-1 overflow-y-auto font-mono text-xs text-[#b8d0ee] space-y-1 select-text">
                {loadingLogs ? (
                  <div className="flex items-center justify-center py-16 gap-3 text-cyberCyan">
                    <RotateCw className="w-5 h-5 animate-spin" />
                    <span>Collecting live container logs via agent action channel...</span>
                  </div>
                ) : containerLogs ? (
                  <pre className="whitespace-pre-wrap leading-relaxed">{containerLogs}</pre>
                ) : (
                  <div className="text-center py-12 text-[#71839e]">No log records returned.</div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 bg-[#050b16] border-t border-lineDark flex items-center justify-between text-[11px] text-[#71839e]">
                <span>Demultiplexed live stdout/stderr streams</span>
                <button
                  onClick={() => {
                    setInspectContainer(null);
                    setContainerLogs(null);
                  }}
                  className="bg-lineDark hover:bg-[#1a2d47] text-white px-3 py-1 rounded text-xs"
                >
                  Close Terminal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enrollment Modal */}
        {showEnrollModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="card-glass p-6 max-w-xl w-full border-cyberCyan/40 space-y-4">
              <h2 className="text-base font-bold text-[#e8f1ff]">Install NexusOps Agent</h2>
              <p className="text-xs text-[#71839e]">
                Run this command on your Linux server (Ubuntu/Debian/Rocky) with root privileges to automatically register and start telemetry collection.
              </p>

              <div className="p-3 bg-[#040810] border border-lineDark rounded-lg flex items-center justify-between text-xs font-mono text-cyberCyan overflow-x-auto">
                <span className="truncate mr-3">{installCmd}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(installCmd);
                    setCopiedCmd(true);
                    setTimeout(() => setCopiedCmd(false), 2000);
                  }}
                  className="bg-lineDark hover:bg-[#20334d] text-white p-1.5 rounded transition-all shrink-0"
                >
                  {copiedCmd ? <Check className="w-4 h-4 text-cyberGreen" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-[11px] text-[#71839e] space-y-1">
                <p>• The agent requires zero dependencies and executes as a lightweight daemon (&lt;15MB RAM).</p>
                <p>• Commands and remediations are policy-controlled and strictly allowlisted.</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="border border-lineDark hover:bg-white/5 text-[#e8f1ff] px-4 py-2 rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
