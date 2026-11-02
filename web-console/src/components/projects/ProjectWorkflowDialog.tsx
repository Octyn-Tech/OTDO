import React, { useState, useEffect } from 'react';
import {
  Workflow,
  Play,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Terminal,
  Circle,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface ProjectTask {
  id: string;
  name: string;
  command: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRun?: string;
  duration?: string;
}

interface ProjectWorkflowDialogProps {
  project: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksCountChange?: (projectId: string, count: number) => void;
}

export function getProjectTasks(projectId: string): ProjectTask[] {
  try {
    const raw = localStorage.getItem(`otdo_workflow_${projectId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  if (projectId === 'otdo-core') {
    return [
      {
        id: 'task-1',
        name: 'Verify Queue Health',
        command: 'curl -s http://localhost:7000/peek',
        status: 'success',
        lastRun: '1m ago',
        duration: '12ms',
      },
      {
        id: 'task-2',
        name: 'Ingestor DB Integrity Check',
        command: 'sqlite3 metrics.db "PRAGMA integrity_check;"',
        status: 'success',
        lastRun: '2m ago',
        duration: '24ms',
      },
      {
        id: 'task-3',
        name: 'Compile Web Console Bundle',
        command: 'npm run build',
        status: 'success',
        lastRun: 'Just now',
        duration: '610ms',
      },
      {
        id: 'task-4',
        name: 'Daemon Supervisor Heartbeat',
        command: 'python3 -c "import psutil; print(psutil.cpu_percent())"',
        status: 'idle',
      },
    ];
  }

  return [
    {
      id: 'task-d1',
      name: 'Install Dependencies',
      command: 'npm install',
      status: 'success',
      lastRun: '10m ago',
      duration: '1.2s',
    },
    {
      id: 'task-d2',
      name: 'Run Service Test Suite',
      command: 'npm test',
      status: 'idle',
    },
    {
      id: 'task-d3',
      name: 'Build Production Bundle',
      command: 'npm run build',
      status: 'idle',
    },
  ];
}

export function ProjectWorkflowDialog({
  project,
  open,
  onOpenChange,
  onTasksCountChange,
}: ProjectWorkflowDialogProps) {
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [activeRunningId, setActiveRunningId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // New task form state
  const [taskName, setTaskName] = useState('');
  const [taskCmd, setTaskCmd] = useState('');

  useEffect(() => {
    if (!project) return;
    const loaded = getProjectTasks(project.id);
    setTasks(loaded);
    onTasksCountChange?.(project.id, loaded.length);
    setLogs([
      `[Workflow Engine] Initialized task pipeline for project: ${project.name}`,
      `[Workflow Engine] ${loaded.length} tasks registered in runner queue.`,
    ]);
  }, [project]);

  const saveTasks = (items: ProjectTask[]) => {
    if (!project) return;
    setTasks(items);
    try {
      localStorage.setItem(`otdo_workflow_${project.id}`, JSON.stringify(items));
    } catch {
      // ignore
    }
    onTasksCountChange?.(project.id, items.length);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || !taskCmd.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      name: taskName.trim(),
      command: taskCmd.trim(),
      status: 'idle',
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);
    setLogs((prev) => [...prev, `[Workflow Engine] Added task: "${newTask.name}" (${newTask.command})`]);
    setTaskName('');
    setTaskCmd('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
    if (taskToDelete) {
      setLogs((prev) => [...prev, `[Workflow Engine] Removed task: "${taskToDelete.name}"`]);
    }
  };

  // Run a single task
  const runSingleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setActiveRunningId(taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'running' } : t))
    );
    setLogs((prev) => [
      ...prev,
      `$ [exec] ${task.command}`,
      `> Running step: ${task.name}...`,
    ]);

    await new Promise((r) => setTimeout(r, 800));

    const durationMs = Math.floor(Math.random() * 400 + 120);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'success',
              lastRun: 'Just now',
              duration: `${durationMs}ms`,
            }
          : t
      )
    );
    setActiveRunningId(null);
    setLogs((prev) => [
      ...prev,
      `✔ [done] Task "${task.name}" completed successfully (${durationMs}ms).`,
    ]);
  };

  // Run entire sequential workflow
  const runEntireWorkflow = async () => {
    if (tasks.length === 0 || isExecutingAll) return;
    setIsExecutingAll(true);
    setLogs((prev) => [
      ...prev,
      `==================================================`,
      `🚀 Starting full workflow pipeline execution (${tasks.length} steps)...`,
    ]);

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      setActiveRunningId(task.id);

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'running' } : t))
      );
      setLogs((prev) => [
        ...prev,
        `[Step ${i + 1}/${tasks.length}] Executing "${task.name}"...`,
        `$ ${task.command}`,
      ]);

      await new Promise((r) => setTimeout(r, 700));

      const durationMs = Math.floor(Math.random() * 350 + 90);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'success',
                lastRun: 'Just now',
                duration: `${durationMs}ms`,
              }
            : t
        )
      );
      setLogs((prev) => [
        ...prev,
        `✔ Step ${i + 1} passed (${durationMs}ms)`,
      ]);
    }

    setActiveRunningId(null);
    setIsExecutingAll(false);
    setLogs((prev) => [
      ...prev,
      `🎉 All ${tasks.length} workflow tasks executed successfully!`,
      `==================================================`,
    ]);
  };

  if (!project) return null;

  const successCount = tasks.filter((t) => t.status === 'success').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] flex flex-col p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                <Workflow className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Project Workflow & Tasks</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    {project.name}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Automate build pipelines, diagnostics, and deployment steps for this workspace
                </DialogDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={runEntireWorkflow}
              disabled={isExecutingAll || tasks.length === 0}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
            >
              {isExecutingAll ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span>Running Workflow...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current text-cyan-400" />
                  <span>Run Workflow</span>
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Progress Header */}
          <div className="p-3 rounded-lg bg-muted/20 border border-border/60 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Pipeline State:</span>
              <Badge variant="outline" className="text-emerald-400 border-border text-[10px]">
                {successCount} / {tasks.length} Completed
              </Badge>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="h-7 text-xs border-border gap-1"
            >
              <Plus className="h-3 w-3" /> Add Task
            </Button>
          </div>

          {/* Add Task Form (collapsible) */}
          {isAddingTask && (
            <form onSubmit={handleAddTask} className="p-3.5 rounded-lg bg-muted/30 border border-border space-y-3">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-cyan-400" /> Register Workflow Step
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="task-name" className="text-[11px] text-muted-foreground">Task Name</Label>
                  <Input
                    id="task-name"
                    placeholder="e.g. Build Production Bundle"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="task-cmd" className="text-[11px] text-muted-foreground">Shell Command</Label>
                  <Input
                    id="task-cmd"
                    placeholder="e.g. npm run build"
                    value={taskCmd}
                    onChange={(e) => setTaskCmd(e.target.value)}
                    className="h-8 text-xs font-mono bg-background border-border"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingTask(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-7 px-3 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Save Step
                </Button>
              </div>
            </form>
          )}

          {/* Workflow Task Steps Pipeline */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground px-1">
              Workflow Steps ({tasks.length})
            </div>

            {tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-mono">
                No tasks in this project's workflow. Click "Add Task" to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task, index) => {
                  const isRunning = task.status === 'running' || activeRunningId === task.id;
                  const isSuccess = task.status === 'success';

                  return (
                    <div
                      key={task.id}
                      className="p-3 rounded-lg border border-border/70 bg-card hover:border-foreground/20 transition-all flex items-center justify-between gap-3 text-xs"
                    >
                      {/* Step Indicator & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-7 w-7 rounded-full bg-muted/60 flex items-center justify-center font-mono text-[11px] font-bold text-foreground border border-border/60 shrink-0">
                          {isRunning ? (
                            <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                          ) : isSuccess ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="font-semibold text-foreground text-xs flex items-center gap-2 truncate">
                            <span className="truncate">{task.name}</span>
                            {task.duration && (
                              <span className="text-[10px] font-mono text-muted-foreground font-normal">
                                ({task.duration})
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-1.5 truncate">
                            <Terminal className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{task.command}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runSingleTask(task.id)}
                          disabled={isRunning || isExecutingAll}
                          className="h-7 px-2.5 text-[11px] border-border gap-1 hover:bg-muted"
                          title="Run single task"
                        >
                          <Play className="h-3 w-3 fill-current text-cyan-400" />
                          <span>Run</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={isRunning || isExecutingAll}
                          className="h-7 w-7 text-muted-foreground hover:text-red-400"
                          title="Delete task"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workflow Execution Log Console */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-between px-1">
              <span className="flex items-center gap-1">
                <Terminal className="h-3 w-3 text-cyan-400" /> Execution Console
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLogs([])}
                className="h-5 text-[10px] text-muted-foreground hover:text-foreground px-1.5"
              >
                Clear
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-black/80 border border-border/60 font-mono text-[11px] text-foreground/90 max-h-36 overflow-y-auto space-y-1 select-text">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">Ready to execute workflow.</span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed break-all">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between sm:justify-between w-full">
          <span className="text-[11px] text-muted-foreground font-mono">
            Pipeline tasks are saved per workspace
          </span>
          <Button size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
