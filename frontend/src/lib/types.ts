export interface DockerContainerInfo {
  id: string;
  names: string[];
  image: string;
  command: string;
  state: string;
  status: string;
  created: number;
  cpu_percent?: number;
  cpuPercent?: number;
  memory_usage_mb?: number;
  memoryUsageMb?: number;
  memory_limit_mb?: number;
  memoryLimitMb?: number;
  memory_percent?: number;
  memoryPercent?: number;
  ports?: Array<{
    IP?: string;
    PrivatePort: number;
    PublicPort?: number;
    Type: string;
  }>;
}

export interface RedisHealth {
  available: boolean;
  latency_ms?: number;
  version?: string;
  memory_human?: string;
  connected_clients?: number;
  ops_per_sec?: number;
  uptime_days?: number;
  hit_rate?: number;
}

export interface PostgresHealth {
  available: boolean;
  latency_ms?: number;
  active_connections?: number;
  version?: string;
}

export interface PortProbe {
  port: number;
  name: string;
  open: boolean;
  latency_ms: number;
}

export interface DiskMountInfo {
  mount: string;
  fs_type: string;
  total_gb: number;
  used_gb: number;
  percent: number;
  inodes_percent: number;
}

export interface SSLCertInfo {
  domain: string;
  valid: boolean;
  days_remaining: number;
  issuer: string;
}

export interface ServicePluginsPayload {
  redis?: RedisHealth;
  postgres?: PostgresHealth;
  ports?: PortProbe[];
  mounts?: DiskMountInfo[];
  failed_systemd?: string[];
  ssl_certs?: SSLCertInfo[];
}

export interface ProcessInfo {
  pid: number;
  user: string;
  cpu: number;
  memory: number;
  vsz: string;
  rss: string;
  status: string;
  time: string;
  command: string;
}

export interface SystemLogEntry {
  timestamp: string;
  priority: string;
  unit: string;
  message: string;
}

export interface Server {
  id: string;
  hostname: string;
  displayName: string;
  ipAddress: string;
  osName: string;
  osVersion: string;
  agentVersion: string;
  status: "ONLINE" | "WARNING" | "CRITICAL" | "OFFLINE";
  lastSeenAt: string;
  currentCpu?: number;
  currentMemory?: number;
  currentDisk?: number;
  dockerContainers?: string;
  topProcesses?: string;
  criticalLogs?: string;
  servicePlugins?: string;
}

export interface MetricPoint {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  load1m: number;
  networkIn: number;
  networkOut: number;
}

export interface Alert {
  id: string;
  serverId: string;
  serverName: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  type: string;
  title: string;
  description: string;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  primaryServerId?: string;
  primaryServerName?: string;
  severity: "WARNING" | "CRITICAL";
  status: "OPEN" | "INVESTIGATING" | "MITIGATED" | "RESOLVED";
  title: string;
  summary: string;
  openedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AiEvidence {
  type: string;
  value: string;
  threshold?: string;
}

export interface AiRecommendation {
  actionType: string;
  reason: string;
  risk: "SAFE" | "MODERATE" | "HIGH";
  requiresApproval: boolean;
}

export interface AiAnalysis {
  id: string;
  incidentId: string;
  provider: string;
  model: string;
  summary: string;
  probableCause: string;
  confidence: number;
  impact: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: AiEvidence[];
  recommendations: AiRecommendation[];
  createdAt: string;
}

export interface Action {
  id: string;
  incidentId?: string;
  incidentNumber?: string;
  serverId: string;
  serverName: string;
  actionType: string;
  riskLevel: "SAFE" | "MODERATE" | "HIGH";
  status: "PROPOSED" | "APPROVED" | "REJECTED" | "RUNNING" | "COMPLETED" | "VERIFIED" | "FAILED";
  requestedBy: string;
  parameters: string;
  result?: string;
  requestedAt: string;
  approvedAt?: string;
  verifiedAt?: string;
}

export interface DashboardSummary {
  systemHealth: number;
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  totalServices: number;
  uptimePercent: number;
  openIncidentsCount: number;
  pendingApprovalsCount: number;
  servers: Server[];
  activeIncidents: Incident[];
  pendingActions: Action[];
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    timeAgo: string;
    status: string;
  }>;
}

export interface AuditLogItem {
  id: string;
  actorType: string;
  eventType: string;
  resourceType: string;
  resourceId?: string;
  metadata?: string;
  createdAt: string;
}
