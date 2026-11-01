import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const [_latestMetric, setLatestMetric] = useState<MetricData | null>(() => {
    try {
      const cached = sessionStorage.getItem('otdo_cached_metric');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [queueInfo, setQueueInfo] = useState<QueueStatus>({ queue_size: 0, max_size: 1000 });
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [_lastUpdated, setLastUpdated] = useState<string>(() => {
    try {
      return sessionStorage.getItem('otdo_cached_timestamp') || 'Live';
    } catch {
      return 'Live';
    }
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchMetrics = useCallback(async () => {
    try {
      // Concurrently fetch queue status and peek telemetry to keep connection state live
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

        {/* Overview Page Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="pb-6">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">System Overview</h1>
          </div>

          {/* Rest is blank */}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
