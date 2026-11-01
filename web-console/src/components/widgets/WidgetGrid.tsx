import React from 'react';
import {
  Activity,
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Radio,
  Server,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export interface MetricData {
  timestamp: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  net_sent_kb?: number;
  net_recv_kb?: number;
  disk_read_kb?: number;
  disk_write_kb?: number;
  uptime_seconds?: number;
  load_avg_1m?: number;
  active_processes?: number;
  db_size_bytes?: number;
  db_record_count?: number;
}

interface QueueStatus {
  queue_size: number;
  max_size: number;
}

interface WidgetGridProps {
  activeWidgetIds: string[];
  onOpenAddModal: () => void;
  metric: MetricData | null;
  queueInfo: QueueStatus;
  isOnline: boolean;
}

function formatSpeed(kb: number = 0): string {
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB/s`;
  }
  return `${kb.toFixed(1)} KB/s`;
}

function formatBytes(bytes: number = 0): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
}

function formatUptime(seconds: number = 0): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export function WidgetGrid({
  activeWidgetIds,
  onOpenAddModal,
  metric,
  queueInfo,
  isOnline,
}: WidgetGridProps) {
  if (activeWidgetIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border/80 rounded-xl bg-card/20 text-center space-y-4 my-8">
        <div className="h-12 w-12 rounded-xl bg-muted border border-border/60 flex items-center justify-center text-muted-foreground">
          <Layers className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">No Widgets Added</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Your System Overview is currently blank. Click the button below to select widgets to pin to your dashboard.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onOpenAddModal}
          className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Widget</span>
        </Button>
      </div>
    );
  }

  // Active flags
  const hasCpu = activeWidgetIds.includes('cpu');
  const hasMemory = activeWidgetIds.includes('memory');
  const hasDisk = activeWidgetIds.includes('disk');
  const hasNetwork = activeWidgetIds.includes('network');
  const hasDiskIo = activeWidgetIds.includes('disk_io');
  const hasDatabase = activeWidgetIds.includes('database');
  const hasUptime = activeWidgetIds.includes('uptime_tasks');
  const hasQueue = activeWidgetIds.includes('queue');

  const hasPipeline = activeWidgetIds.includes('pipeline');
  const hasNode = activeWidgetIds.includes('node');
  const hasTelemetryFrame = activeWidgetIds.includes('telemetry_frame');

  return (
    <div className="space-y-6">
      {/* Primary Telemetry Metric Cards Grid */}
      {(hasCpu || hasMemory || hasDisk || hasNetwork || hasDiskIo || hasDatabase || hasUptime || hasQueue) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CPU Card */}
          {hasCpu && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    CPU Utilization
                  </CardTitle>
                  <CardDescription className="text-[11px]">System compute core load</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <Cpu className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-mono font-bold tracking-tight">
                    {metric?.cpu_usage !== undefined ? `${metric.cpu_usage.toFixed(1)}%` : '0.0%'}
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                    {(metric?.cpu_usage ?? 0) > 80 ? 'Heavy Load' : 'Optimal'}
                  </Badge>
                </div>
                <Progress value={metric?.cpu_usage ?? 0} className="h-1.5 bg-muted" />
              </CardContent>
            </Card>
          )}

          {/* Memory Card */}
          {hasMemory && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Memory Utilization
                  </CardTitle>
                  <CardDescription className="text-[11px]">Physical RAM allocation</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <Activity className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-mono font-bold tracking-tight">
                    {metric?.memory_usage !== undefined ? `${metric.memory_usage.toFixed(1)}%` : '0.0%'}
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                    {(metric?.memory_usage ?? 0) > 85 ? 'High Usage' : 'Normal'}
                  </Badge>
                </div>
                <Progress value={metric?.memory_usage ?? 0} className="h-1.5 bg-muted" />
              </CardContent>
            </Card>
          )}

          {/* Disk Card */}
          {hasDisk && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Storage Utilization
                  </CardTitle>
                  <CardDescription className="text-[11px]">Primary filesystem partition</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <HardDrive className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-mono font-bold tracking-tight">
                    {metric?.disk_usage !== undefined ? `${metric.disk_usage.toFixed(1)}%` : '0.0%'}
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                    Mounted /
                  </Badge>
                </div>
                <Progress value={metric?.disk_usage ?? 0} className="h-1.5 bg-muted" />
              </CardContent>
            </Card>
          )}

          {/* Network I/O Card */}
          {hasNetwork && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Network I/O Throughput
                  </CardTitle>
                  <CardDescription className="text-[11px]">Real-time bandwidth transfer</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <ArrowDownUp className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowDown className="h-3 w-3 text-emerald-400" /> Down
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {formatSpeed(metric?.net_recv_kb)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ArrowUp className="h-3 w-3 text-cyan-400" /> Up
                    </span>
                    <span className="text-base font-bold text-foreground">
                      {formatSpeed(metric?.net_sent_kb)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Traffic</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-emerald-400">
                    Live Stream
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disk I/O Card */}
          {hasDiskIo && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Disk I/O Throughput
                  </CardTitle>
                  <CardDescription className="text-[11px]">Active read/write transfer rates</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <Gauge className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-muted-foreground">Read</span>
                    <span className="text-base font-bold text-foreground">
                      {formatSpeed(metric?.disk_read_kb)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-muted-foreground">Write</span>
                    <span className="text-base font-bold text-foreground">
                      {formatSpeed(metric?.disk_write_kb)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Drive</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    IOPS Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingestor Database Store Card */}
          {hasDatabase && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Ingestor Database
                  </CardTitle>
                  <CardDescription className="text-[11px]">SQLite persistent telemetry storage</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <Database className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-mono font-bold tracking-tight">
                    {(metric?.db_record_count ?? 0).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">rows</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {formatBytes(metric?.db_size_bytes)} on disk
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground font-mono">Table: system_metrics</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-emerald-400">
                    Synced
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Uptime & Load Card */}
          {hasUptime && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    System Uptime & Tasks
                  </CardTitle>
                  <CardDescription className="text-[11px]">Kernel duration & load average</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <Clock className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-mono font-bold tracking-tight">
                    {formatUptime(metric?.uptime_seconds)}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    Load 1m: {metric?.load_avg_1m ?? '0.00'} · {metric?.active_processes ?? 0} tasks
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Status</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    Online
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queue Monitor Card */}
          {hasQueue && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Queue Buffer
                  </CardTitle>
                  <CardDescription className="text-[11px]">In-memory async queue capacity</CardDescription>
                </div>
                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                  <Layers className="h-4 w-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline justify-between">
                  <div className="text-3xl font-mono font-bold tracking-tight">
                    {queueInfo.queue_size} <span className="text-sm font-normal text-muted-foreground">/ {queueInfo.max_size}</span>
                  </div>
                  <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                    {queueInfo.queue_size > 0 ? 'Active Queue' : 'Buffer Idle'}
                  </Badge>
                </div>
                <Progress
                  value={queueInfo.max_size > 0 ? (queueInfo.queue_size / queueInfo.max_size) * 100 : 0}
                  className="h-1.5 bg-muted"
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Middle Row: Node Properties & Pipeline Architecture */}
      {(hasNode || hasPipeline) && (
        <div className={`grid grid-cols-1 ${hasNode && hasPipeline ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-5`}>
          {hasNode && (
            <Card className={`bg-card border-border shadow-sm ${hasNode && !hasPipeline ? 'w-full' : ''}`}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" /> Node Properties
                  </CardTitle>
                  <CardDescription className="text-xs">Host system parameters</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Hostname</span>
                  <span className="font-semibold text-foreground">{metric?.hostname || 'Unknown host'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Reported Stamp</span>
                  <span className="text-foreground truncate max-w-[180px]">{metric?.timestamp || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Queue Endpoint</span>
                  <span className="text-foreground">http://localhost:7000</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Poll Frequency</span>
                  <span className="text-foreground">1000 ms</span>
                </div>
              </CardContent>
            </Card>
          )}

          {hasPipeline && (
            <Card className={`bg-card border-border shadow-sm ${hasNode && hasPipeline ? 'lg:col-span-2' : 'w-full'}`}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" /> Pipeline Architecture
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Coordinated microservices pipeline health
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-border">
                  4 Daemons
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-foreground">QUEUE-SRV</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">FastAPI Memory Queue • :7000</div>
                    </div>
                    <CheckCircle2 className={`h-4 w-4 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-foreground">COLLECTOR</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">psutil Metric Producer Daemon</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-foreground">INGESTOR</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">aiosqlite Database Consumer</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>

                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                    <div>
                      <div className="font-medium text-foreground">DASHBOARD</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">React + Vite + Tailwind Console • :5173</div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Raw JSON Frame Widget */}
      {hasTelemetryFrame && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" /> Raw Telemetry Frame
              </CardTitle>
              <CardDescription className="text-xs">
                Active JSON packet peeked from in-memory queue buffer
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">
              JSON Packet
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-black/60 border border-border p-3 font-mono text-[11px] text-muted-foreground overflow-x-auto">
              <pre className="text-foreground">
                {metric ? JSON.stringify(metric, null, 2) : '// Awaiting incoming telemetry stream...'}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
