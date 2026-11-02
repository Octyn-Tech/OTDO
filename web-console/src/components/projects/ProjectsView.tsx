import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  GitBranch,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Box,
  FolderPlus,
  ShieldCheck,
  Activity,
  Key,
  Workflow,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { GIT_CREDENTIALS_STORAGE_KEY, GitCredentials } from '@/components/settings/GitCredentialsCard';
import { ProjectSecretsDialog, getProjectSecrets } from './ProjectSecretsDialog';
import { ProjectWorkflowDialog, getProjectTasks } from './ProjectWorkflowDialog';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  path: string;
  branch: string;
  servicesCount: number;
  tags: string[];
  status: 'Active' | 'Synced' | 'Idle';
  lastActivity: string;
  gitRepo?: string;
  isPrimary?: boolean;
}

const PROJECTS_STORAGE_KEY = 'otdo_saved_projects';

const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: 'otdo-core',
    name: 'OTDO System',
    description: 'All-in-one distributed telemetry microservices coordinator and high-speed monitoring suite',
    path: '~/personal/OTDO',
    branch: 'main',
    servicesCount: 4,
    tags: ['Microservices', 'FastAPI', 'React 19', 'SQLite'],
    status: 'Active',
    lastActivity: 'Active Session',
    gitRepo: 'https://github.com/snyder/OTDO.git',
    isPrimary: true,
  },
];

interface ProjectsViewProps {
  onNavigateToOverview: () => void;
  onNavigateToSettings: () => void;
}

export function ProjectsView({ onNavigateToOverview, onNavigateToSettings }: ProjectsViewProps) {
  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_PROJECTS;
    } catch {
      return DEFAULT_PROJECTS;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [gitUsername, setGitUsername] = useState<string | null>(null);

  // Active dialog states for secrets and workflows
  const [selectedSecretsProject, setSelectedSecretsProject] = useState<ProjectItem | null>(null);
  const [selectedWorkflowProject, setSelectedWorkflowProject] = useState<ProjectItem | null>(null);
  const [secretsCounts, setSecretsCounts] = useState<Record<string, number>>({});
  const [tasksCounts, setTasksCounts] = useState<Record<string, number>>({});

  // New Project Form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newBranch, setNewBranch] = useState('main');
  const [newTags, setNewTags] = useState('');

  useEffect(() => {
    try {
      const credsRaw = localStorage.getItem(GIT_CREDENTIALS_STORAGE_KEY);
      if (credsRaw) {
        const creds: GitCredentials = JSON.parse(credsRaw);
        if (creds.username) setGitUsername(creds.username);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveProjects = (items: ProjectItem[]) => {
    setProjects(items);
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const parsedTags = newTags
      ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
      : ['Workspace'];

    const newProject: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom managed codebase workspace',
      path: newPath.trim() || `~/projects/${newName.toLowerCase().replace(/\s+/g, '-')}`,
      branch: newBranch.trim() || 'main',
      servicesCount: 1,
      tags: parsedTags,
      status: 'Active',
      lastActivity: 'Just now',
    };

    saveProjects([...projects, newProject]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewDesc('');
    setNewPath('');
    setNewBranch('main');
    setNewTags('');
  };

  const handleDeleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
  };

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Projects</h1>
            <Badge variant="outline" className="font-mono text-[10px] border-border text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'Workspace' : 'Workspaces'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Managed codebases, active microservices repositories, and deployment workspaces
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {gitUsername ? (
            <Badge
              variant="outline"
              onClick={onNavigateToSettings}
              className="text-xs font-mono border-border text-emerald-400 gap-1.5 py-1 px-2.5 cursor-pointer hover:bg-muted/30"
              title="Click to manage Git credentials in Settings"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Git: @{gitUsername}</span>
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToSettings}
              className="h-8 text-xs font-mono border-border text-muted-foreground hover:text-foreground"
            >
              Configure Git PAT
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </Button>
        </div>
      </div>

      {/* Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9 bg-background/50 border-border"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-muted-foreground">
          <span className="text-[11px] font-mono">Status:</span>
          <Badge variant="outline" className="text-[10px] font-mono border-border text-emerald-400 bg-muted/20">
            Active
          </Badge>
          <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground">
            In Sync
          </Badge>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="bg-card border-border shadow-sm hover:border-foreground/30 transition-all flex flex-col justify-between group"
          >
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60 shrink-0">
                    <FolderGit2 className="h-4 w-4 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                      <span>{project.name}</span>
                      {project.isPrimary && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 uppercase font-mono border-border text-muted-foreground">
                          Host Root
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-muted-foreground truncate">
                      {project.path}
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="font-mono text-[10px] shrink-0 border-border text-emerald-400"
                >
                  {project.status}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                {project.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
              {/* Branch & Services */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-muted/20 border border-border/40 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                  <GitBranch className="h-3 w-3 shrink-0 text-foreground" />
                  <span className="truncate">{project.branch}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground justify-end truncate">
                  <Box className="h-3 w-3 shrink-0 text-foreground" />
                  <span>{project.servicesCount} Services</span>
                </div>
              </div>

              {/* Quick Workspace Actions: Secrets & Tasks Workflow */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSecretsProject(project)}
                  className="h-7 px-2 text-[11px] font-mono border-border/80 hover:border-amber-400/50 hover:bg-muted/40 justify-start gap-1.5"
                  title="Manage Project Secrets"
                >
                  <Key className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="truncate">Secrets ({secretsCounts[project.id] ?? getProjectSecrets(project.id).length})</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWorkflowProject(project)}
                  className="h-7 px-2 text-[11px] font-mono border-border/80 hover:border-cyan-400/50 hover:bg-muted/40 justify-start gap-1.5"
                  title="View Workflow Tasks"
                >
                  <Workflow className="h-3 w-3 text-cyan-400 shrink-0" />
                  <span className="truncate">Tasks ({tasksCounts[project.id] ?? getProjectTasks(project.id).length})</span>
                </Button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 h-4 border-border/60 text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-3 border-t border-border/40 flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {project.lastActivity}
              </span>

              <div className="flex items-center gap-1">
                {project.isPrimary ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onNavigateToOverview}
                    className="h-7 px-2.5 text-[11px] border-border hover:bg-muted"
                  >
                    <Activity className="h-3 w-3 mr-1 text-emerald-400" /> Monitor
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    className="h-7 px-2 text-muted-foreground hover:text-red-400 hover:bg-muted"
                    title="Delete project"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}

        {/* Create new project blank card */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-foreground/40 hover:bg-muted/10 transition-all cursor-pointer min-h-[220px] text-center"
        >
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border/60">
            <FolderPlus className="h-5 w-5 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground">Add Another Project</span>
          <p className="text-[11px] text-muted-foreground max-w-[200px]">
            Link a local repository or microservices directory
          </p>
        </button>
      </div>

      {/* Add New Project Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-border/60">
            <DialogTitle className="text-base font-semibold text-foreground">
              Add New Project
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Register a project workspace to track its microservices and telemetry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name" className="text-xs font-medium">Project Name</Label>
              <Input
                id="proj-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. distributed-ingestor"
                className="text-xs h-9 bg-background/50 border-border"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-path" className="text-xs font-medium">Workspace Path / Git URL</Label>
              <Input
                id="proj-path"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                placeholder="~/personal/my-project or git@github.com:..."
                className="text-xs font-mono h-9 bg-background/50 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="proj-branch" className="text-xs font-medium">Default Branch</Label>
                <Input
                  id="proj-branch"
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  placeholder="main"
                  className="text-xs font-mono h-9 bg-background/50 border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proj-tags" className="text-xs font-medium">Tags (comma-separated)</Label>
                <Input
                  id="proj-tags"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="FastAPI, Redis"
                  className="text-xs h-9 bg-background/50 border-border"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proj-desc" className="text-xs font-medium">Description</Label>
              <Input
                id="proj-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary of service capabilities..."
                className="text-xs h-9 bg-background/50 border-border"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs font-medium"
              >
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Secrets Management Dialog */}
      <ProjectSecretsDialog
        project={selectedSecretsProject}
        open={Boolean(selectedSecretsProject)}
        onOpenChange={(open) => !open && setSelectedSecretsProject(null)}
        onSecretsCountChange={(projId, count) => {
          setSecretsCounts((prev) => ({ ...prev, [projId]: count }));
        }}
      />

      {/* Project Workflow & Tasks Pipeline Dialog */}
      <ProjectWorkflowDialog
        project={selectedWorkflowProject}
        open={Boolean(selectedWorkflowProject)}
        onOpenChange={(open) => !open && setSelectedWorkflowProject(null)}
        onTasksCountChange={(projId, count) => {
          setTasksCounts((prev) => ({ ...prev, [projId]: count }));
        }}
      />
    </main>
  );
}

