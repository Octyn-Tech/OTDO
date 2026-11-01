import React from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  HardDrive,
  Layers,
  Radio,
  Server,
  X,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface MetricData {
  timestamp: string;
  hostname: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}

interface QueueStatus {
  queue_size: number;
  max_size: number;
}

interface WidgetGridProps {
  activeWidgetIds: string[];
  onRemoveWidget: (id: string) => void;
  onOpenAddModal: () => void;
  metric: MetricData | null;
  queueInfo: QueueStatus;
  isOnline: boolean;
}

export function WidgetGrid({
  activeWidgetIds,
  onRemoveWidget,
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

  // Filter metric cards
  const hasCpu = activeWidgetIds.includes('cpu');
  const hasMemory = activeWidgetIds.includes('memory');
  const hasDisk = activeWidgetIds.includes('disk');
  const hasQueue = activeWidgetIds.includes('queue');

  const hasPipeline = activeWidgetIds.includes('pipeline');
  const hasNode = activeWidgetIds.includes('node');
  const hasTelemetryFrame = activeWidgetIds.includes('telemetry_frame');

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      {(hasCpu || hasMemory || hasDisk || hasQueue) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* CPU Card */}
          {hasCpu && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors relative group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    CPU Utilization
                  </CardTitle>
                  <CardDescription className="text-[11px]">System compute core load</CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                    <Cpu className="h-4 w-4 text-foreground" />
                  </div>
                  <button
                    onClick={() => onRemoveWidget('cpu')}
                    title="Remove widget"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
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
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors relative group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Memory Utilization
                  </CardTitle>
                  <CardDescription className="text-[11px]">Physical RAM allocation</CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                    <Activity className="h-4 w-4 text-foreground" />
                  </div>
                  <button
                    onClick={() => onRemoveWidget('memory')}
                    title="Remove widget"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
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
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors relative group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Storage Utilization
                  </CardTitle>
                  <CardDescription className="text-[11px]">Primary filesystem partition</CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                    <HardDrive className="h-4 w-4 text-foreground" />
                  </div>
                  <button
                    onClick={() => onRemoveWidget('disk')}
                    title="Remove widget"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
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

          {/* Queue Monitor Card */}
          {hasQueue && (
            <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors relative group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                    Queue Buffer
                  </CardTitle>
                  <CardDescription className="text-[11px]">In-memory async queue capacity</CardDescription>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                    <Layers className="h-4 w-4 text-foreground" />
                  </div>
                  <button
                    onClick={() => onRemoveWidget('queue')}
                    title="Remove widget"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
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
            <Card className={`bg-card border-border shadow-sm relative group ${hasNode && !hasPipeline ? 'w-full' : ''}`}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" /> Node Properties
                  </CardTitle>
                  <CardDescription className="text-xs">Host system parameters</CardDescription>
                </div>
                <button
                  onClick={() => onRemoveWidget('node')}
                  title="Remove widget"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
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
            <Card className={`bg-card border-border shadow-sm relative group ${hasNode && hasPipeline ? 'lg:col-span-2' : 'w-full'}`}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" /> Pipeline Architecture
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Coordinated microservices pipeline health
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    4 Daemons
                  </Badge>
                  <button
                    onClick={() => onRemoveWidget('pipeline')}
                    title="Remove widget"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
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
        <Card className="bg-card border-border shadow-sm relative group">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-muted-foreground" /> Raw Telemetry Frame
              </CardTitle>
              <CardDescription className="text-xs">
                Active JSON packet peeked from in-memory queue buffer
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px]">
                JSON Packet
              </Badge>
              <button
                onClick={() => onRemoveWidget('telemetry_frame')}
                title="Remove widget"
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
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
