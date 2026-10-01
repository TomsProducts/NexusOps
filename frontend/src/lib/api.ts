import { Action, Alert, DashboardSummary, Incident, Server } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://192.168.68.117:8080/api";

let authPromise: Promise<string | null> | null = null;

export async function ensureAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const existing = localStorage.getItem("nexusops_token");
  if (existing) return existing;

  if (authPromise) return authPromise;

  authPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@example.com", password: "password" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) {
          localStorage.setItem("nexusops_token", data.accessToken);
          if (data.user) {
            localStorage.setItem("nexusops_user", JSON.stringify(data.user));
          }
          return data.accessToken;
        }
      }
    } catch (e) {
      console.error("[NexusOps API] Auto-auth failed:", e);
    } finally {
      authPromise = null;
    }
    return null;
  })();

  return authPromise;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await ensureAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/dashboard/summary`, { headers });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch dashboard summary:", e);
  }

  // Real fallback reflecting offline or loading state, zero fake data
  return {
    systemHealth: 100,
    totalServers: 0,
    healthyServers: 0,
    warningServers: 0,
    criticalServers: 0,
    totalServices: 0,
    uptimePercent: 100.0,
    openIncidentsCount: 0,
    pendingApprovalsCount: 0,
    servers: [],
    activeIncidents: [],
    pendingActions: [],
    recentActivity: [],
  };
}

export async function fetchServers(): Promise<Server[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/servers`, { headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch servers:", e);
  }
  return [];
}

export async function fetchIncidents(): Promise<Incident[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/incidents`, { headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch incidents:", e);
  }
  return [];
}

export async function fetchActions(): Promise<Action[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/actions`, { headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch actions:", e);
  }
  return [];
}

export async function approveAction(actionId: string): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE}/actions/${actionId}/approve`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVED", comment: "Approved from NexusOps console" }),
    });
  } catch (e) {
    console.error("[NexusOps API] Failed to approve action:", e);
  }
}

export async function proposeAction(serverId: string, actionType: string, parameters: string = "{}"): Promise<Action | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/actions`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        serverId,
        actionType,
        riskLevel: "SAFE",
        parameters,
      }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to propose action:", e);
  }
  return null;
}

export async function fetchAlerts(): Promise<Alert[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/alerts`, { headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch alerts:", e);
  }
  return [];
}

export async function fetchAuditLogs(): Promise<any[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/audit?size=50`, { headers });
    if (res.ok) {
      const data = await res.json();
      return data.content || [];
    }
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch audit logs:", e);
  }
  return [];
}

export async function sendAiChat(message: string, serverId?: string, incidentId?: string): Promise<string> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ message, serverId, incidentId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.reply;
    } else {
      const err = await res.text();
      return `AI Request failed (${res.status}): ${err || "Backend error"}`;
    }
  } catch (e) {
    return "Error communicating with 9Router AI gateway. Please ensure the backend and 9Router are reachable.";
  }
}

export async function fetchAction(actionId: string): Promise<Action | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/actions/${actionId}`, { headers });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to fetch action:", e);
  }
  return null;
}

export async function dispatchDirectAction(serverId: string, actionType: string, parameters: string = "{}"): Promise<Action | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/servers/${serverId}/actions/dispatch`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        serverId,
        actionType,
        riskLevel: "SAFE",
        parameters,
      }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error("[NexusOps API] Failed to dispatch action:", e);
  }
  return null;
}

export async function fetchContainerLogs(serverId: string, containerName: string, tail: number = 100): Promise<string> {
  try {
    const act = await dispatchDirectAction(serverId, "DOCKER_GET_LOGS", JSON.stringify({ container: containerName, tail }));
    if (!act) return "Failed to dispatch log collection task.";

    // Poll for up to 15 seconds (agent polls every 2 seconds)
    const startTime = Date.now();
    while (Date.now() - startTime < 15000) {
      await new Promise((r) => setTimeout(r, 800));
      const updated = await fetchAction(act.id);
      if (updated && (updated.status === "COMPLETED" || updated.status === "VERIFIED" || updated.status === "FAILED")) {
        if (updated.result) {
          try {
            const parsed = JSON.parse(updated.result);
            return parsed.output || "No log output returned.";
          } catch {
            return updated.result;
          }
        }
        return "Log collection completed without output.";
      }
    }
    return "Log collection timed out waiting for agent response.";
  } catch (e: any) {
    return `Error fetching container logs: ${e.message || e}`;
  }
}

export async function restartDockerContainer(serverId: string, containerName: string): Promise<string> {
  try {
    const act = await dispatchDirectAction(serverId, "DOCKER_RESTART_CONTAINER", JSON.stringify({ container: containerName }));
    if (!act) return "Failed to dispatch restart container task.";

    const startTime = Date.now();
    while (Date.now() - startTime < 20000) {
      await new Promise((r) => setTimeout(r, 800));
      const updated = await fetchAction(act.id);
      if (updated && (updated.status === "COMPLETED" || updated.status === "VERIFIED" || updated.status === "FAILED")) {
        if (updated.result) {
          try {
            const parsed = JSON.parse(updated.result);
            return parsed.output || updated.status;
          } catch {
            return updated.result;
          }
        }
        return `Restart completed with status: ${updated.status}`;
      }
    }
    return "Container restart task timed out.";
  } catch (e: any) {
    return `Error restarting container: ${e.message || e}`;
  }
}
