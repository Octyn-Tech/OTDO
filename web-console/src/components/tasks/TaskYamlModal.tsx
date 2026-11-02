import React, { useState, useEffect } from 'react';
import YAML from 'yaml';
import {
  Upload,
  FileCode,
  Check,
  AlertCircle,
  Copy,
  Sparkles,
  RefreshCw,
  Plus,
  FileCheck,
  Code2,
  FolderOpen,
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
import { Label } from '@/components/ui/label';

export interface ManagedTask {
  id: string;
  name: string;
  command: string;
  description?: string;
  cwd?: string;
  project?: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  lastRun?: string;
  duration?: string;
  exitCode?: number;
  logs?: string[];
  yamlSource?: string;
}

interface TaskYamlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTasks: (newTasks: ManagedTask[]) => void;
  initialMode?: 'editor' | 'upload';
}

const YAML_TEMPLATES = [
  {
    id: 'github-ci',
    name: 'GitHub CI Pipeline (Node.js)',
    description: 'Pull repository, npm ci, build, and npm test',
    yaml: `# GitHub CI Pipeline for Node.js Application
name: "GitHub CI Workflow"
project: "nidoworkz-backend"
cwd: "~/nidoworkz-backend"

steps:
  - name: "Pull Latest Repository"
    command: "git pull"
    description: "Fetch and pull latest changes from remote branch"

  - name: "Clean Install Dependencies"
    command: "npm ci"
    description: "Install exact packages from package-lock.json"

  - name: "Compile Production Build"
    command: "npm run build"
    description: "Build application and microservices bundles"

  - name: "Run Automated Tests"
    command: "npm run test"
    description: "Execute unit and integration test suite"

env:
  NODE_ENV: "production"
`,
  },
  {
    id: 'single-task',
    name: 'Single Shell Command Task',
    description: 'A simple individual task definition',
    yaml: `# Individual Managed Task
name: "Queue Service Health Ping"
command: "curl -s http://localhost:7000/status"
description: "Pings local OTDO queue microservice for health status"
cwd: "~/personal/OTDO"
env:
  SAMPLING_FREQ: "1000ms"
`,
  },
  {
    id: 'python-service',
    name: 'Python Microservice Pipeline',
    description: 'Install dependencies and execute pytest',
    yaml: `# Python Microservice Pipeline
name: "Python Service Test & Validate"
project: "OTDO Core"
cwd: "~/personal/OTDO/metrics-collector"

steps:
  - name: "Install Python Requirements"
    command: "pip install -r requirements.txt"
  - name: "Run Pytest Suite"
    command: "pytest -v"
`,
  },
  {
    id: 'docker-compose',
    name: 'Docker Deployment Task',
    description: 'Build and start containerized stack',
    yaml: `# Docker Deployment Task
name: "Deploy Docker Microservices"
cwd: "~/personal/OTDO"

steps:
  - name: "Pull Latest Images"
    command: "docker compose pull"
  - name: "Build & Start Services"
    command: "docker compose up -d --build"
`,
  },
];

export function TaskYamlModal({
  open,
  onOpenChange,
  onAddTasks,
  initialMode = 'editor',
}: TaskYamlModalProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'upload'>('editor');
  const [yamlContent, setYamlContent] = useState(YAML_TEMPLATES[0].yaml);
  const [selectedTemplateId, setSelectedTemplateId] = useState('github-ci');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ManagedTask[]>([]);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialMode);
    }
  }, [open, initialMode]);

  // Parse YAML in real-time
  useEffect(() => {
    if (!yamlContent.trim()) {
      setParseError(null);
      setParsedPreview([]);
      return;
    }

    try {
      const doc = YAML.parse(yamlContent);
      setParseError(null);

      const tasksToGenerate: ManagedTask[] = [];
      const now = Date.now();

      if (!doc || typeof doc !== 'object') {
        setParseError('YAML must define a valid object or mapping.');
        setParsedPreview([]);
        return;
      }

      // Check if it's a GitHub Actions format: jobs.<job_name>.steps
      if (doc.jobs && typeof doc.jobs === 'object') {
        const jobKeys = Object.keys(doc.jobs);
        jobKeys.forEach((jobKey) => {
          const job = doc.jobs[jobKey];
          if (job && Array.isArray(job.steps)) {
            job.steps.forEach((step: any, sIdx: number) => {
              if (step && (step.run || step.name)) {
                tasksToGenerate.push({
                  id: `task-${now}-${tasksToGenerate.length}`,
                  name: step.name || `Step ${sIdx + 1} (${jobKey})`,
                  command: step.run || `echo "Running ${step.uses || 'step'}"`,
                  description: `GitHub Actions step from job: ${jobKey}`,
                  cwd: doc.cwd,
                  project: doc.project || doc.name,
                  status: 'idle',
                  logs: [],
                  yamlSource: YAML.stringify(step),
                });
              }
            });
          }
        });
      }
      // Check if it has a `steps` array (OTDO pipeline format)
      else if (Array.isArray(doc.steps)) {
        doc.steps.forEach((step: any, idx: number) => {
          if (step && (step.command || step.run || step.name)) {
            tasksToGenerate.push({
              id: `task-${now}-${idx}`,
              name: step.name || `Pipeline Step ${idx + 1}`,
              command: step.command || step.run || 'echo "No command provided"',
              description: step.description || `Step ${idx + 1} of ${doc.name || 'Pipeline'}`,
              cwd: step.cwd || doc.cwd,
              project: doc.project || doc.name,
              status: 'idle',
              logs: [],
              yamlSource: YAML.stringify(step),
            });
          }
        });
      }
      // Check if it's a list of tasks: `tasks: [...]`
      else if (Array.isArray(doc.tasks)) {
        doc.tasks.forEach((t: any, idx: number) => {
          if (t && (t.command || t.name)) {
            tasksToGenerate.push({
              id: `task-${now}-${idx}`,
              name: t.name || `Task ${idx + 1}`,
              command: t.command || t.run || 'echo "No command"',
              description: t.description,
              cwd: t.cwd || doc.cwd,
              project: doc.project,
              status: 'idle',
              logs: [],
              yamlSource: YAML.stringify(t),
            });
          }
        });
      }
      // Otherwise, single task definition: `name`, `command`
      else if (doc.name || doc.command) {
        tasksToGenerate.push({
          id: `task-${now}-0`,
          name: doc.name || 'Custom Task',
          command: doc.command || doc.run || 'echo "Running task"',
          description: doc.description,
          cwd: doc.cwd,
          project: doc.project,
          status: 'idle',
          logs: [],
          yamlSource: yamlContent,
        });
      } else {
        setParseError('YAML does not contain "command", "steps", or "jobs".');
        setParsedPreview([]);
        return;
      }

      setParsedPreview(tasksToGenerate);
    } catch (err: any) {
      setParseError(err.message || 'Invalid YAML format');
      setParsedPreview([]);
    }
  }, [yamlContent]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = YAML_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setYamlContent(tmpl.yaml);
    }
  };

  const handleFileUpload = (file: File) => {
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setYamlContent(content);
        setActiveTab('editor'); // Switch to editor so user sees the parsed content
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleCreate = () => {
    if (parsedPreview.length === 0) return;
    onAddTasks(parsedPreview);
    onOpenChange(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl w-[94vw] max-h-[90vh] flex flex-col p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                <FileCode className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Add Tasks via YAML</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border text-cyan-400">
                    Declarative Tasks
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Define tasks or pipelines using YAML or upload an existing workflow file
                </DialogDescription>
              </div>
            </div>

            {/* Editor / Upload Mode Switcher */}
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'editor'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>YAML Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Upload className="h-3.5 w-3.5 text-amber-400" />
                <span>Upload .yml</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          {activeTab === 'editor' && (
            <div className="space-y-3">
              {/* Template Selector & Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/60 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-muted-foreground text-[11px] flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-cyan-400" /> Preset Templates:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {YAML_TEMPLATES.map((tmpl) => (
                      <Button
                        key={tmpl.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectTemplate(tmpl.id)}
                        className={`h-6 text-[10px] font-mono px-2 border-border/80 ${
                          selectedTemplateId === tmpl.id
                            ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
                            : 'hover:text-foreground'
                        }`}
                      >
                        {tmpl.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 text-[11px] font-mono gap-1 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy YAML
                    </>
                  )}
                </Button>
              </div>

              {/* Monospace Code Editor Area */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 text-[11px] font-mono">
                  <span className="text-muted-foreground">pipeline-definition.yml</span>
                  {parseError ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Syntax Error
                    </span>
                  ) : parsedPreview.length > 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Valid YAML ({parsedPreview.length} {parsedPreview.length === 1 ? 'task' : 'tasks'} parsed)
                    </span>
                  ) : null}
                </div>

                <div className="relative rounded-lg border border-border/80 bg-black overflow-hidden shadow-inner">
                  <textarea
                    value={yamlContent}
                    onChange={(e) => setYamlContent(e.target.value)}
                    rows={12}
                    className="w-full p-3.5 bg-black text-foreground/90 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-cyan-500/30 selection:text-white"
                    placeholder="Enter your YAML pipeline or task definition here..."
                    spellCheck={false}
                  />
                </div>

                {parseError && (
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-500/40 text-red-400 text-[11px] font-mono">
                    {parseError}
                  </div>
                )}
              </div>

              {/* Parsed Tasks Preview List */}
              {parsedPreview.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                    <span>Parsed Tasks Preview ({parsedPreview.length})</span>
                    <span>Ready to import</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {parsedPreview.map((task, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-md border border-border/80 bg-card/60 flex flex-col justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 text-[10px] flex items-center justify-center font-bold shrink-0">
                            {i + 1}
                          </span>
                          <span className="font-semibold text-foreground truncate">{task.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate mt-1">
                          $ {task.command}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4 py-2">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center space-y-3 ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-border/80 bg-background/40 hover:border-foreground/30'
                }`}
              >
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center border border-border">
                  <Upload className="h-6 w-6 text-cyan-400" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    Drag and drop your YAML file here
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports `.yml` and `.yaml` files (e.g. GitHub Actions workflows or OTDO tasks)
                  </p>
                </div>

                <div className="pt-2">
                  <Label
                    htmlFor="yaml-file-input"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-medium border border-border hover:bg-muted/80 transition-colors shadow-xs"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Browse Files</span>
                  </Label>
                  <input
                    id="yaml-file-input"
                    type="file"
                    accept=".yml,.yaml"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                {uploadedFileName && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 pt-2">
                    <FileCheck className="h-4 w-4" />
                    <span>Loaded: {uploadedFileName}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border/60 text-xs space-y-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Automatic Workflow Translation
                </span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  You can upload files from `.github/workflows/*.yml`. OTDO automatically inspects the jobs and steps, extracts the shell commands, and builds ready-to-run interactive pipeline tasks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="pt-3 border-t border-border/80 flex items-center justify-between sm:justify-between w-full">
          <span className="text-[11px] text-muted-foreground font-mono">
            {parsedPreview.length} {parsedPreview.length === 1 ? 'task' : 'tasks'} ready to import
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCreate}
              disabled={parsedPreview.length === 0}
              className="h-8 text-xs font-medium gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Import {parsedPreview.length} {parsedPreview.length === 1 ? 'Task' : 'Tasks'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TaskYamlModal;

