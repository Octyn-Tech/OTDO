import React from 'react';
import {
  Activity,
  ArrowDownUp,
  Check,
  Clock,
  Cpu,
  Database,
  Gauge,
  HardDrive,
  Layers,
  Network,
  Plus,
  Radio,
  Server,
  Thermometer,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface WidgetItem {
  id: string;
  name: string;
  category: 'Resource' | 'Queue' | 'Topology' | 'Diagnostics';
  description: string;
  icon: React.ElementType;
}

export const AVAILABLE_WIDGETS: WidgetItem[] = [
  {
    id: 'cpu',
    name: 'CPU Utilization',
    category: 'Resource',
    description: 'System compute core utilization percentage and real-time load indicator',
    icon: Cpu,
  },
  {
    id: 'memory',
    name: 'Memory Utilization',
    category: 'Resource',
    description: 'Physical RAM allocation and resident memory consumption meter',
    icon: Activity,
  },
  {
    id: 'disk',
    name: 'Storage Utilization',
    category: 'Resource',
    description: 'Primary filesystem partition space usage and mount point',
    icon: HardDrive,
  },
  {
    id: 'network',
    name: 'Network I/O Throughput',
    category: 'Resource',
    description: 'Real-time network transfer rates (live download and upload speeds)',
    icon: ArrowDownUp,
  },
  {
    id: 'disk_io',
    name: 'Disk I/O Throughput',
    category: 'Resource',
    description: 'Real-time filesystem read and write throughput speeds',
    icon: Gauge,
  },
  {
    id: 'temperature',
    name: 'Server Temperature',
    category: 'Resource',
    description: 'Hardware thermal sensor readings, CPU die temperature, and dissipation status',
    icon: Thermometer,
  },
  {
    id: 'database',
    name: 'Ingestor Database Store',
    category: 'Diagnostics',
    description: 'SQLite database disk footprint and total ingested telemetry records',
    icon: Database,
  },
  {
    id: 'uptime_tasks',
    name: 'System Uptime & Load',
    category: 'Diagnostics',
    description: 'Continuous uptime duration, 1m load average, and active system processes',
    icon: Clock,
  },
  {
    id: 'queue',
    name: 'Queue Service Monitor',
    category: 'Queue',
    description: 'In-memory async buffer status, peek counter, and capacity limits',
    icon: Layers,
  },
  {
    id: 'pipeline',
    name: 'Pipeline Architecture',
    category: 'Topology',
    description: 'Real-time daemon coordinator and microservices pipeline status grid',
    icon: Server,
  },
  {
    id: 'node',
    name: 'Node Telemetry Properties',
    category: 'Diagnostics',
    description: 'Host machine hostname, telemetry timestamps, and polling metrics',
    icon: Server,
  },
  {
    id: 'telemetry_frame',
    name: 'Raw Telemetry Frame',
    category: 'Diagnostics',
    description: 'Live formatted JSON payload peeked directly from the active queue buffer',
    icon: Radio,
  },
];

interface AddWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeWidgetIds: string[];
  onToggleWidget: (id: string) => void;
  onAddAll: () => void;
  onRemoveAll: () => void;
}

export function AddWidgetDialog({
  open,
  onOpenChange,
  activeWidgetIds,
  onToggleWidget,
  onAddAll,
  onRemoveAll,
}: AddWidgetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 bg-card border-border shadow-2xl overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-foreground">
              Add Widgets
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-border">
              {activeWidgetIds.length} / {AVAILABLE_WIDGETS.length} Active
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Choose which metrics and diagnostic widgets to pin to your System Overview dashboard.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable list of available widgets */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {AVAILABLE_WIDGETS.map((widget) => {
            const Icon = widget.icon;
            const isAdded = activeWidgetIds.includes(widget.id);

            return (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isAdded
                    ? 'border-foreground/20 bg-muted/40 shadow-xs'
                    : 'border-border/70 bg-card hover:border-border hover:bg-muted/20'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0 pr-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center border border-border/60 shrink-0 mt-0.5">
                    <Icon className="h-4.5 w-4.5 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{widget.name}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground">
                        {widget.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {widget.description}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isAdded ? 'secondary' : 'outline'}
                  onClick={() => onToggleWidget(widget.id)}
                  className={`h-8 px-3 text-xs font-medium shrink-0 transition-colors ${
                    isAdded ? 'text-emerald-400 border-border hover:text-red-400 hover:border-red-500/40' : ''
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>Add</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer with bulk controls */}
        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between sm:justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddAll}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Add All
            </Button>
            {activeWidgetIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemoveAll}
                className="h-8 text-xs text-muted-foreground hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-medium"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
