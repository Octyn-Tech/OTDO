import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Database,
  Layers,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  Server,
  Settings,
  Sliders,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { GitCredentialsCard } from '@/components/settings/GitCredentialsCard';
import { ProjectsView } from '@/components/projects/ProjectsView';
import { AddWidgetDialog, AVAILABLE_WIDGETS } from '@/components/AddWidgetDialog';
import {
  WidgetGrid,
  DEFAULT_CUSTOMIZATIONS,
  CUSTOMIZATIONS_STORAGE_KEY,
} from '@/components/widgets/WidgetGrid';
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
  cpu_temp_c?: number;
  gpu_temp_c?: number;
  nvme_temp_c?: number;
}

interface QueueStatus {
  queue_size: number;
  max_size: number;
}

export const DEFAULT_ACTIVE_WIDGET_IDS = [
  'cpu',
  'disk',
  'memory',
  'temperature',
  'disk_io',
  'network',
  'database',
  'uptime_tasks',
  'queue',
];

const WIDGETS_STORAGE_KEY = 'otdo_active_widgets_v2';
const VIEW_STORAGE_KEY = 'otdo_active_view';

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
  const [currentView, setCurrentView] = useState<'overview' | 'projects' | 'settings'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'settings' || hash === 'projects' || hash === 'overview') {
          return hash as 'overview' | 'projects' | 'settings';
        }
        const saved = localStorage.getItem(VIEW_STORAGE_KEY);
        if (saved === 'settings' || saved === 'projects' || saved === 'overview') {
          return saved as 'overview' | 'projects' | 'settings';
        }
      }
      return 'overview';
    } catch {
      return 'overview';
    }
  });

  const handleViewChange = (view: 'overview' | 'projects' | 'settings') => {
    setCurrentView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
      if (window.location.hash !== `#${view}`) {
        window.history.replaceState(null, '', `#${view}`);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'settings' || hash === 'projects' || hash === 'overview') {
        setCurrentView(hash as 'overview' | 'projects' | 'settings');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Widget management state with localStorage persistence
  const [activeWidgetIds, setActiveWidgetIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WIDGETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return DEFAULT_ACTIVE_WIDGET_IDS;
    } catch {
      return DEFAULT_ACTIVE_WIDGET_IDS;
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

  const handleResetDefault = () => {
    setActiveWidgetIds(DEFAULT_ACTIVE_WIDGET_IDS);
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVE_WIDGET_IDS));
      localStorage.setItem(CUSTOMIZATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOMIZATIONS));
    } catch {
      // ignore storage error
    }
    window.location.reload();
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
      <AppSidebar currentView={currentView} onViewChange={handleViewChange} />

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

        {currentView === 'overview' && (
          /* Overview Page Main Content */
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
        )}

        {currentView === 'projects' && (
          /* Projects Page Main Content */
          <ProjectsView
            onNavigateToOverview={() => handleViewChange('overview')}
            onNavigateToSettings={() => handleViewChange('settings')}
          />
        )}

        {currentView === 'settings' && (
          /* Settings Page Main Content */
          <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Settings</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Node configuration, telemetry pipeline endpoints, and console preferences
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewChange('overview')}
                className="h-8 gap-1.5 text-xs border-border"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Overview</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Git Credentials & Token Store */}
              <GitCredentialsCard />

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-foreground" />
                    <CardTitle className="text-sm font-semibold">Microservices & Telemetry</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Active daemon background processes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground font-sans text-xs">Queue Service API</span>
                    <Badge variant="outline" className="text-emerald-400 border-border text-[10px]">
                      http://localhost:7000
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground font-sans text-xs">Telemetry Sampling</span>
                    <span className="font-semibold text-foreground">1,000 ms</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground font-sans text-xs">Database Engine</span>
                    <span className="text-foreground">SQLite 3 (WAL mode)</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-muted-foreground font-sans text-xs">Ingestor Worker</span>
                    <Badge variant="outline" className="text-emerald-400 border-border text-[10px]">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-foreground" />
                    <CardTitle className="text-sm font-semibold">Console Layout</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Overview canvas and widget presets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Active Widgets</span>
                    <span className="font-mono font-semibold">{activeWidgetIds.length} widgets pinned</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground">Theme Palette</span>
                    <span className="font-mono text-muted-foreground">Shadcn Pure Black</span>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetDefault}
                      className="w-full text-xs border-border hover:bg-muted"
                    >
                      Reset Overview to Default Layout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        )}

        {/* Add Widget Options Modal */}
        <AddWidgetDialog
          open={isAddWidgetOpen}
          onOpenChange={setIsAddWidgetOpen}
          activeWidgetIds={activeWidgetIds}
          onToggleWidget={handleToggleWidget}
          onAddAll={handleAddAll}
          onRemoveAll={handleRemoveAll}
          onResetDefault={handleResetDefault}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
