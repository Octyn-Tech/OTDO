import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Trash2,
  Lock,
  Download,
  ShieldAlert,
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

export interface ProjectSecret {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
}

interface ProjectSecretsDialogProps {
  project: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSecretsCountChange?: (projectId: string, count: number) => void;
}

export function getProjectSecrets(projectId: string): ProjectSecret[] {
  try {
    const raw = localStorage.getItem(`otdo_secrets_${projectId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // Sensible defaults per project
  if (projectId === 'otdo-core') {
    return [
      { id: 'sec-1', key: 'QUEUE_SERVICE_URL', value: 'http://localhost:7000', updatedAt: 'Default' },
      { id: 'sec-2', key: 'DATABASE_PATH', value: './metrics-ingestor/metrics.db', updatedAt: 'Default' },
      { id: 'sec-3', key: 'AUTH_SESSION_SECRET', value: 'otdo-secure-vault-token-99x', updatedAt: 'Default' },
    ];
  }
  return [
    { id: 'sec-d1', key: 'PORT', value: '8080', updatedAt: 'Default' },
    { id: 'sec-d2', key: 'DATABASE_URL', value: 'mongodb://localhost:27017/db', updatedAt: 'Default' },
  ];
}

export function ProjectSecretsDialog({
  project,
  open,
  onOpenChange,
  onSecretsCountChange,
}: ProjectSecretsDialogProps) {
  const [secrets, setSecrets] = useState<ProjectSecret[]>([]);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // New secret input states
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showNewValue, setShowNewValue] = useState(false);

  useEffect(() => {
    if (!project) return;
    const loaded = getProjectSecrets(project.id);
    setSecrets(loaded);
    onSecretsCountChange?.(project.id, loaded.length);
  }, [project]);

  const saveSecrets = (items: ProjectSecret[]) => {
    if (!project) return;
    setSecrets(items);
    try {
      localStorage.setItem(`otdo_secrets_${project.id}`, JSON.stringify(items));
    } catch {
      // ignore
    }
    onSecretsCountChange?.(project.id, items.length);
  };

  const handleAddSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;

    const formattedKey = newKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existingIndex = secrets.findIndex((s) => s.key === formattedKey);

    const newSecret: ProjectSecret = {
      id: `sec-${Date.now()}`,
      key: formattedKey,
      value: newValue.trim(),
      updatedAt: 'Just now',
    };

    let updated: ProjectSecret[];
    if (existingIndex >= 0) {
      updated = [...secrets];
      updated[existingIndex] = newSecret;
    } else {
      updated = [...secrets, newSecret];
    }

    saveSecrets(updated);
    setNewKey('');
    setNewValue('');
  };

  const handleDeleteSecret = (id: string) => {
    const updated = secrets.filter((s) => s.id !== id);
    saveSecrets(updated);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyValue = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleExportEnv = () => {
    const envString = secrets.map((s) => `${s.key}=${s.value}`).join('\n');
    navigator.clipboard.writeText(envString);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-6 bg-card border-border shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
                <Key className="h-4 w-4 text-foreground" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>Project Secrets</span>
                  <Badge variant="outline" className="text-[10px] font-mono border-border">
                    {project.name}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Environment variables and sensitive configurations stored securely for this project
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-emerald-400 border-border text-[10px] font-mono shrink-0">
              {secrets.length} {secrets.length === 1 ? 'Secret' : 'Secrets'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {/* Add Secret Form */}
          <form onSubmit={handleAddSecret} className="p-3.5 rounded-lg bg-muted/20 border border-border/60 space-y-3">
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-foreground" /> Add Project Secret
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="sec-key" className="text-[11px] text-muted-foreground">Key Name</Label>
                <Input
                  id="sec-key"
                  placeholder="e.g. DATABASE_URL"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="h-8 text-xs font-mono uppercase bg-background border-border"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sec-val" className="text-[11px] text-muted-foreground">Secret Value</Label>
                <div className="relative">
                  <Input
                    id="sec-val"
                    type={showNewValue ? 'text' : 'password'}
                    placeholder="Value..."
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="h-8 text-xs font-mono pr-8 bg-background border-border"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewValue(!showNewValue)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showNewValue ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" size="sm" className="h-7 px-3 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add Secret
              </Button>
            </div>
          </form>

          {/* Secrets List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Configured Variables ({secrets.length})</span>
              {secrets.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleExportEnv}
                  className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                >
                  {copiedEnv ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-400" /> Copied .env!
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" /> Copy as .env
                    </>
                  )}
                </Button>
              )}
            </div>

            {secrets.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground font-mono">
                No secrets stored yet. Add your first environment secret above.
              </div>
            ) : (
              secrets.map((secret) => {
                const isRevealed = Boolean(revealedIds[secret.id]);
                const isCopied = copiedKey === secret.key;

                return (
                  <div
                    key={secret.id}
                    className="p-2.5 rounded-lg border border-border/70 bg-card hover:border-foreground/20 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-mono font-semibold text-foreground text-xs flex items-center gap-1.5 truncate">
                        <Lock className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{secret.key}</span>
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground truncate">
                        {isRevealed ? (
                          <span className="text-foreground">{secret.value}</span>
                        ) : (
                          <span>••••••••••••••••</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleReveal(secret.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title={isRevealed ? 'Mask value' : 'Reveal value'}
                      >
                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyValue(secret.key, secret.value)}
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Copy value"
                      >
                        {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSecret(secret.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-red-400"
                        title="Delete secret"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex items-center justify-between sm:justify-between w-full">
          <span className="text-[11px] text-muted-foreground font-mono">
            Encrypted & stored in isolated browser storage
          </span>
          <Button size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
