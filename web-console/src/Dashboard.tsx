import React, { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { AddWidgetDialog, AVAILABLE_WIDGETS } from '@/components/AddWidgetDialog';
import { WidgetGrid } from '@/components/widgets/WidgetGrid';
import { useAuth } from './context/AuthContext';

interface MetricData {
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

const WIDGETS_STORAGE_KEY = 'otdo_active_widgets';

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
  const [_lastUpdated, setLastUpdated] = useState<string>(() => {
    try {
      return sessionStorage.getItem('otdo_cached_timestamp') || 'Live';
    } catch {
      return 'Live';
    }
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Widget management state with localStorage persistence
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  const handleToggleWidget = (id: string) => {
    setActiveWidgetIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const handleReorder = (newOrder: string[]) => {
    setActiveWidgetIds(newOrder);
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(newOrder));
    } catch {
      // ignore storage error
    }
  };

  const handleRemoveWidget = (id: string) => {
    setActiveWidgetIds((prev) => {
      const next = prev.filter((item) => item !== id);
      try {
        localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const handleAddAll = () => {
    const allIds = AVAILABLE_WIDGETS.map((w) => w.id);
    setActiveWidgetIds(allIds);
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(allIds));
    } catch {
      // ignore storage error
    }
  };

  const handleRemoveAll = () => {
    setActiveWidgetIds([]);
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore storage error
    }
  };

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
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">System Overview</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customizable real-time resource monitor and telemetry widgets
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddWidgetOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Widget</span>
            </Button>
          </div>

          {/* Dynamic Widget Grid Canvas */}
          <WidgetGrid
            activeWidgetIds={activeWidgetIds}
            onReorder={handleReorder}
            onOpenAddModal={() => setIsAddWidgetOpen(true)}
            metric={latestMetric}
            queueInfo={queueInfo}
            isOnline={isOnline}
          />
        </main>

        {/* Add Widget Options Modal */}
        <AddWidgetDialog
          open={isAddWidgetOpen}
          onOpenChange={setIsAddWidgetOpen}
          activeWidgetIds={activeWidgetIds}
          onToggleWidget={handleToggleWidget}
          onAddAll={handleAddAll}
          onRemoveAll={handleRemoveAll}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
