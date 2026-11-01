import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Layers,
  LogOut,
  RefreshCw,
  Server,
  Database,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from './context/AuthContext';

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

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [latestMetric, setLatestMetric] = useState<MetricData | null>(() => {
    try {
      const cached = sessionStorage.getItem('otdo_cached_metric');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [queueInfo, setQueueInfo] = useState<QueueStatus>({ queue_size: 0, max_size: 1000 });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    try {
      return sessionStorage.getItem('otdo_cached_timestamp') || 'Live';
    } catch {
      return 'Live';
    }
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchMetrics = useCallback(async () => {
    try {
      // Fetch queue status and peek telemetry concurrently for minimum latency
      const [statusRes, peekRes] = await Promise.all([
        fetch('http://localhost:7000/status'),
        fetch('http://localhost:7000/peek'),
      ]);

      if (!statusRes.ok) throw new Error('Status endpoint failure');
      const statusData = await statusRes.json();
      setQueueInfo(statusData);
      setIsOnline(true);

      if (peekRes.ok) {
        const peekData = await peekRes.json();
        if (peekData.data) {
          setLatestMetric(peekData.data);
          const timeStr = new Date().toLocaleTimeString();
          setLastUpdated(timeStr);
          try {
            sessionStorage.setItem('otdo_cached_metric', JSON.stringify(peekData.data));
            sessionStorage.setItem('otdo_cached_timestamp', timeStr);
          } catch {
            // ignore storage quota error
          }
        }
      }
    } catch {
      setIsOnline(false);
    }
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchMetrics();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'OP';

  return (
    <SidebarProvider defaultOpen={true} className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Black / Blank Minimalist Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <SidebarInset className="bg-background min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="border-b border-border/70 bg-card/40 backdrop-blur sticky top-0 z-30">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Title Context */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">OTDO System, All in One</span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border-border">
                v1.0
              </Badge>
            </div>

            {/* Center Connection Status */}
            <div className="hidden md:flex items-center gap-2">
              <Badge
                variant={isOnline ? 'outline' : 'destructive'}
                className="px-2.5 py-1 text-xs font-mono font-medium flex items-center gap-1.5 border-border"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse' : 'bg-red-500'
                  }`}
                />
                {isOnline ? 'NODE CONNECTED' : 'BACKEND OFFLINE'}
              </Badge>

              <Badge variant="secondary" className="px-2.5 py-1 text-xs font-mono">
                <Layers className="h-3 w-3 mr-1 opacity-70" />
                Queue: {queueInfo.queue_size} / {queueInfo.max_size}
              </Badge>
            </div>

            {/* Right User & Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 border-border"
                title="Refresh telemetry"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-0.5" />

              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="text-[11px] font-mono bg-muted text-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium leading-none">{user?.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{user?.role}</div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">System Telemetry</h2>
            <p className="text-xs text-muted-foreground">
              Real-time resource utilization and message queue ingestion stream
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Radio className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Last Sync: {lastUpdated}</span>
          </div>
        </div>

        {/* Primary Metric Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* CPU Card */}
          <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  CPU Utilization
                </CardTitle>
                <CardDescription className="text-[11px]">System core compute load</CardDescription>
              </div>
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                <Cpu className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold tracking-tight">
                  {latestMetric?.cpu_usage !== undefined ? `${latestMetric.cpu_usage.toFixed(1)}%` : '0.0%'}
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-muted-foreground border-border"
                >
                  {(latestMetric?.cpu_usage ?? 0) > 80 ? 'Heavy Load' : 'Optimal'}
                </Badge>
              </div>
              <Progress
                value={latestMetric?.cpu_usage ?? 0}
                className="h-1.5 bg-muted"
              />
            </CardContent>
          </Card>

          {/* Memory Card */}
          <Card className="bg-card border-border shadow-sm hover:border-foreground/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  Memory Utilization
                </CardTitle>
                <CardDescription className="text-[11px]">Resident RAM allocation</CardDescription>
              </div>
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                <Activity className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-mono font-bold tracking-tight">
                  {latestMetric?.memory_usage !== undefined ? `${latestMetric.memory_usage.toFixed(1)}%` : '0.0%'}
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-muted-foreground border-border"
                >
                  {(latestMetric?.memory_usage ?? 0) > 85 ? 'High Usage' : 'Normal'}
                </Badge>
              </div>
              <Progress
                value={latestMetric?.memory_usage ?? 0}
                className="h-1.5 bg-muted"
              />
            </CardContent>
          </Card>

          {/* Disk Card */}
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
                  {latestMetric?.disk_usage !== undefined ? `${latestMetric.disk_usage.toFixed(1)}%` : '0.0%'}
                </div>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-muted-foreground border-border"
                >
                  Mounted /
                </Badge>
              </div>
              <Progress
                value={latestMetric?.disk_usage ?? 0}
                className="h-1.5 bg-muted"
              />
            </CardContent>
          </Card>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Node & Architecture Info */}
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" /> Node Telemetry Properties
              </CardTitle>
              <CardDescription className="text-xs">Identified host metadata and parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Hostname</span>
                <span className="font-semibold text-foreground">{latestMetric?.hostname || 'Unknown host'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Reported Stamp</span>
                <span className="text-foreground truncate max-w-[180px]">{latestMetric?.timestamp || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Queue Service</span>
                <span className="text-foreground">http://localhost:7000</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Poll Frequency</span>
                <span className="text-foreground">1000 ms</span>
              </div>
            </CardContent>
          </Card>

          {/* Microservices Topology */}
          <Card className="bg-card border-border shadow-sm lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" /> Pipeline Architecture
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Coordinated daemons and microservices status
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-border">
                  4 Services Running
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Service 1 */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">QUEUE-SRV</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">FastAPI Memory Queue • :7000</div>
                  </div>
                  <CheckCircle2 className={`h-4 w-4 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>

                {/* Service 2 */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">COLLECTOR</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">psutil Metric Producer Daemon</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>

                {/* Service 3 */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-foreground">INGESTOR</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">aiosqlite Database Consumer</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>

                {/* Service 4 */}
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
        </div>

        {/* Live Payload Preview / Diagnostics */}
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
                {latestMetric ? JSON.stringify(latestMetric, null, 2) : '// Awaiting incoming telemetry stream...'}
              </pre>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  </SidebarProvider>
  );
}
