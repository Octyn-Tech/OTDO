import React, { useState, useEffect } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowDownUp,
  ArrowUp,
  BarChart2,
  CheckCircle2,
  CircleDot,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Maximize2,
  Minimize2,
  Network,
  Plus,
  Radio,
  Server,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SparklineChart, RadialGauge, SegmentedBlocks } from './ChartViews';

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

type WidgetSize = '1x' | '2x' | '4x';
type ChartStyle = 'bar' | 'wave' | 'radial' | 'blocks';

interface WidgetCustomization {
  size: WidgetSize;
  style: ChartStyle;
}

const CUSTOMIZATIONS_STORAGE_KEY = 'otdo_widget_customizations';

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
  // Widget customization preferences (size + chart style)
  const [customizations, setCustomizations] = useState<Record<string, WidgetCustomization>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMIZATIONS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Rolling metric history for live wave/sparkline charts (last 20 samples)
  const [history, setHistory] = useState<{
    cpu: number[];
    memory: number[];
    disk: number[];
    net_recv: number[];
    disk_write: number[];
    queue: number[];
  }>({
    cpu: [],
    memory: [],
    disk: [],
    net_recv: [],
    disk_write: [],
    queue: [],
  });

  useEffect(() => {
    if (!metric) return;
    setHistory((prev) => {
      const push = (arr: number[], val: number) => {
        const next = [...arr, val];
        return next.length > 20 ? next.slice(next.length - 20) : next;
      };
      return {
        cpu: push(prev.cpu, metric.cpu_usage || 0),
        memory: push(prev.memory, metric.memory_usage || 0),
        disk: push(prev.disk, metric.disk_usage || 0),
        net_recv: push(prev.net_recv, metric.net_recv_kb || 0),
        disk_write: push(prev.disk_write, metric.disk_write_kb || 0),
        queue: push(prev.queue, queueInfo.queue_size || 0),
      };
    });
  }, [metric, queueInfo.queue_size]);

  const updateCustomization = (widgetId: string, partial: Partial<WidgetCustomization>) => {
    setCustomizations((prev) => {
      const current = prev[widgetId] || { size: '1x', style: 'bar' };
      const updated = {
        ...prev,
        [widgetId]: { ...current, ...partial },
      };
      try {
        localStorage.setItem(CUSTOMIZATIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });
  };

  const cycleSize = (widgetId: string) => {
    const current = customizations[widgetId]?.size || '1x';
    const nextSize: WidgetSize = current === '1x' ? '2x' : current === '2x' ? '4x' : '1x';
    updateCustomization(widgetId, { size: nextSize });
  };

  const cycleStyle = (widgetId: string, availableStyles: ChartStyle[] = ['bar', 'wave', 'radial', 'blocks']) => {
    const current = customizations[widgetId]?.style || 'bar';
    const currentIndex = availableStyles.indexOf(current);
    const nextStyle = availableStyles[(currentIndex + 1) % availableStyles.length];
    updateCustomization(widgetId, { style: nextStyle });
  };

  const getSizeClasses = (widgetId: string, defaultSpan: string = 'col-span-1') => {
    const size = customizations[widgetId]?.size || '1x';
    if (size === '4x') return 'col-span-1 md:col-span-2 lg:col-span-4';
    if (size === '2x') return 'col-span-1 md:col-span-2';
    return defaultSpan;
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-fr">
      {/* 1. CPU Card */}
      {hasCpu && (() => {
        const style = customizations['cpu']?.style || 'bar';
        const size = customizations['cpu']?.size || '1x';
        const cpuVal = metric?.cpu_usage ?? 0;

        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('cpu')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  CPU Utilization
                </CardTitle>
                <CardDescription className="text-[11px]">System compute core load</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                {/* Style Switcher */}
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleStyle('cpu')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Chart Style: {style} (click to toggle)</span>
                  </TooltipContent>
                </Tooltip>

                {/* Resize Switcher */}
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('cpu')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <Cpu className="h-4 w-4 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold tracking-tight">
                  {cpuVal.toFixed(1)}%
                </div>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                  {cpuVal > 80 ? 'Heavy Load' : 'Optimal'}
                </Badge>
              </div>

              {/* Dynamic Chart Style Rendering */}
              {style === 'bar' && (
                <Progress value={cpuVal} className="h-1.5 bg-muted" />
              )}
              {style === 'wave' && (
                <SparklineChart data={history.cpu} maxVal={100} unit="%" height={size === '1x' ? 48 : 64} />
              )}
              {style === 'radial' && (
                <RadialGauge value={cpuVal} max={100} size={74} label="CPU %" />
              )}
              {style === 'blocks' && (
                <SegmentedBlocks value={cpuVal} max={100} segments={16} />
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* 2. Memory Card */}
      {hasMemory && (() => {
        const style = customizations['memory']?.style || 'bar';
        const size = customizations['memory']?.size || '1x';
        const memVal = metric?.memory_usage ?? 0;

        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('memory')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Memory Utilization
                </CardTitle>
                <CardDescription className="text-[11px]">Physical RAM allocation</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleStyle('memory')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Chart Style: {style} (click to toggle)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('memory')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <Activity className="h-4 w-4 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold tracking-tight">
                  {memVal.toFixed(1)}%
                </div>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                  {memVal > 85 ? 'High Usage' : 'Normal'}
                </Badge>
              </div>

              {style === 'bar' && (
                <Progress value={memVal} className="h-1.5 bg-muted" />
              )}
              {style === 'wave' && (
                <SparklineChart data={history.memory} maxVal={100} unit="%" height={size === '1x' ? 48 : 64} />
              )}
              {style === 'radial' && (
                <RadialGauge value={memVal} max={100} size={74} label="RAM %" />
              )}
              {style === 'blocks' && (
                <SegmentedBlocks value={memVal} max={100} segments={16} />
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* 3. Storage Utilization Card */}
      {hasDisk && (() => {
        const style = customizations['disk']?.style || 'bar';
        const size = customizations['disk']?.size || '1x';
        const diskVal = metric?.disk_usage ?? 0;

        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('disk')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Storage Utilization
                </CardTitle>
                <CardDescription className="text-[11px]">Primary filesystem partition</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleStyle('disk')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Chart Style: {style} (click to toggle)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('disk')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <HardDrive className="h-4 w-4 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold tracking-tight">
                  {diskVal.toFixed(1)}%
                </div>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                  Mounted /
                </Badge>
              </div>

              {style === 'bar' && (
                <Progress value={diskVal} className="h-1.5 bg-muted" />
              )}
              {style === 'wave' && (
                <SparklineChart data={history.disk} maxVal={100} unit="%" height={size === '1x' ? 48 : 64} />
              )}
              {style === 'radial' && (
                <RadialGauge value={diskVal} max={100} size={74} label="Disk %" />
              )}
              {style === 'blocks' && (
                <SegmentedBlocks value={diskVal} max={100} segments={16} />
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* 4. Network I/O Throughput Card */}
      {hasNetwork && (() => {
        const style = customizations['network']?.style || 'bar';
        const size = customizations['network']?.size || '1x';
        const recvSpeed = metric?.net_recv_kb || 0;
        const sentSpeed = metric?.net_sent_kb || 0;

        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('network')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Network I/O Throughput
                </CardTitle>
                <CardDescription className="text-[11px]">Real-time bandwidth transfer</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleStyle('network', ['bar', 'wave'])}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">View Style: {style} (click to toggle)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('network')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <ArrowDownUp className="h-4 w-4 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-emerald-400" /> Down
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {formatSpeed(recvSpeed)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-cyan-400" /> Up
                  </span>
                  <span className="text-base font-bold text-foreground">
                    {formatSpeed(sentSpeed)}
                  </span>
                </div>
              </div>

              {style === 'wave' ? (
                <SparklineChart data={history.net_recv} height={size === '1x' ? 44 : 56} unit=" KB/s" />
              ) : (
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Traffic Channel</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-emerald-400">
                    Live Stream
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* 5. Disk I/O Throughput Card */}
      {hasDiskIo && (() => {
        const style = customizations['disk_io']?.style || 'bar';
        const size = customizations['disk_io']?.size || '1x';
        const readSpeed = metric?.disk_read_kb || 0;
        const writeSpeed = metric?.disk_write_kb || 0;

        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('disk_io')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Disk I/O Throughput
                </CardTitle>
                <CardDescription className="text-[11px]">Active read/write transfer rates</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleStyle('disk_io', ['bar', 'wave'])}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">View Style: {style} (click to toggle)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('disk_io')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <Gauge className="h-4 w-4 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs text-muted-foreground">Read</span>
                  <span className="text-base font-bold text-foreground">
                    {formatSpeed(readSpeed)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs text-muted-foreground">Write</span>
                  <span className="text-base font-bold text-foreground">
                    {formatSpeed(writeSpeed)}
                  </span>
                </div>
              </div>

              {style === 'wave' ? (
                <SparklineChart data={history.disk_write} height={size === '1x' ? 44 : 56} unit=" KB/s" />
              ) : (
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-[10px] text-muted-foreground">Drive Controller</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    IOPS Active
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* 6. Ingestor Database Store Card */}
      {hasDatabase && (() => {
        const size = customizations['database']?.size || '1x';
        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('database')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Ingestor Database
                </CardTitle>
                <CardDescription className="text-[11px]">SQLite persistent telemetry storage</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('database')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <Database className="h-4 w-4 text-foreground" />
                </div>
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
        );
      })()}

      {/* 7. System Uptime & Tasks Card */}
      {hasUptime && (() => {
        const size = customizations['uptime_tasks']?.size || '1x';
        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('uptime_tasks')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  System Uptime & Tasks
                </CardTitle>
                <CardDescription className="text-[11px]">Kernel duration & load average</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('uptime_tasks')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <Clock className="h-4 w-4 text-foreground" />
                </div>
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
                <span className="text-[10px] text-muted-foreground">Daemon Status</span>
                <Badge variant="outline" className="text-[10px] font-mono border-border">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* 8. Queue Buffer Monitor Card */}
      {hasQueue && (() => {
        const style = customizations['queue']?.style || 'bar';
        const size = customizations['queue']?.size || '1x';
        const qSize = queueInfo.queue_size || 0;
        const qMax = queueInfo.max_size || 1000;
        const qPct = qMax > 0 ? (qSize / qMax) * 100 : 0;

        return (
          <Card className={`bg-card border-border shadow-sm hover:border-foreground/20 transition-all ${getSizeClasses('queue')} group`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Queue Buffer
                </CardTitle>
                <CardDescription className="text-[11px]">In-memory async queue capacity</CardDescription>
              </div>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleStyle('queue')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <BarChart2 className="h-3.5 w-3.5" />
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Chart Style: {style} (click to toggle)</span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('queue')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>

                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 ml-1">
                  <Layers className="h-4 w-4 text-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold tracking-tight">
                  {qSize} <span className="text-sm font-normal text-muted-foreground">/ {qMax}</span>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
                  {qSize > 0 ? 'Active Queue' : 'Buffer Idle'}
                </Badge>
              </div>

              {style === 'bar' && (
                <Progress value={qPct} className="h-1.5 bg-muted" />
              )}
              {style === 'wave' && (
                <SparklineChart data={history.queue} maxVal={qMax} unit=" items" height={size === '1x' ? 48 : 64} />
              )}
              {style === 'radial' && (
                <RadialGauge value={qSize} max={qMax} size={74} label="items" />
              )}
              {style === 'blocks' && (
                <SegmentedBlocks value={qSize} max={qMax} segments={16} />
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* 9. Node Telemetry Properties Card */}
      {hasNode && (() => {
        const size = customizations['node']?.size || '2x';
        return (
          <Card className={`bg-card border-border shadow-sm transition-all ${getSizeClasses('node', 'col-span-1 md:col-span-2')} group`}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" /> Node Properties
                </CardTitle>
                <CardDescription className="text-xs">Host system parameters</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger render={
                  <button
                    type="button"
                    onClick={() => cycleSize('node')}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                  </button>
                } />
                <TooltipContent side="top">
                  <span className="text-[11px]">Size: {size} (click to resize)</span>
                </TooltipContent>
              </Tooltip>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Hostname</span>
                <span className="font-semibold text-foreground">{metric?.hostname || 'Unknown host'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Reported Stamp</span>
                <span className="text-foreground truncate max-w-[200px]">{metric?.timestamp || 'N/A'}</span>
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
        );
      })()}

      {/* 10. Pipeline Architecture Card */}
      {hasPipeline && (() => {
        const size = customizations['pipeline']?.size || '2x';
        return (
          <Card className={`bg-card border-border shadow-sm transition-all ${getSizeClasses('pipeline', 'col-span-1 md:col-span-2')} group`}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" /> Pipeline Architecture
                </CardTitle>
                <CardDescription className="text-xs">
                  Coordinated microservices pipeline health
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-mono border-border">
                  4 Daemons
                </Badge>
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('pipeline')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '1x' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">QUEUE-SRV</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">:7000 Memory Queue</div>
                  </div>
                  <CheckCircle2 className={`h-4 w-4 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">COLLECTOR</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">psutil Metric Producer</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">INGESTOR</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">aiosqlite Database Worker</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/20 p-2.5 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">DASHBOARD</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">:5173 Console UI</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* 11. Raw Telemetry Frame Card */}
      {hasTelemetryFrame && (() => {
        const size = customizations['telemetry_frame']?.size || '4x';
        return (
          <Card className={`bg-card border-border shadow-sm transition-all ${getSizeClasses('telemetry_frame', 'col-span-1 md:col-span-2 lg:col-span-4')} group`}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Radio className="h-4 w-4 text-muted-foreground" /> Raw Telemetry Frame
                </CardTitle>
                <CardDescription className="text-xs">
                  Active JSON packet peeked from in-memory queue buffer
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-[10px]">
                  JSON Stream
                </Badge>
                <Tooltip>
                  <TooltipTrigger render={
                    <button
                      type="button"
                      onClick={() => cycleSize('telemetry_frame')}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      {size === '4x' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                    </button>
                  } />
                  <TooltipContent side="top">
                    <span className="text-[11px]">Size: {size} (click to resize)</span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-black/60 border border-border p-3 font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-64">
                <pre className="text-foreground">
                  {metric ? JSON.stringify(metric, null, 2) : '// Awaiting incoming telemetry stream...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        );
      })()}
    </div>
  );
}
