import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  KeyRound,
  Eye,
  EyeOff,
  Check,
  Trash2,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const GIT_CREDENTIALS_STORAGE_KEY = 'otdo_git_credentials';

export interface GitCredentials {
  username: string;
  pat: string;
  updatedAt?: string;
}

export function GitCredentialsCard() {
  const [username, setUsername] = useState('');
  const [pat, setPat] = useState('');
  const [showPat, setShowPat] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasStored, setHasStored] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(GIT_CREDENTIALS_STORAGE_KEY);
      if (stored) {
        const parsed: GitCredentials = JSON.parse(stored);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.pat) setPat(parsed.pat);
        if (parsed.username || parsed.pat) {
          setHasStored(true);
        }
        if (parsed.updatedAt) {
          setLastSavedTime(new Date(parsed.updatedAt).toLocaleTimeString());
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const creds: GitCredentials = {
      username: username.trim(),
      pat: pat.trim(),
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(GIT_CREDENTIALS_STORAGE_KEY, JSON.stringify(creds));
      setHasStored(Boolean(creds.username || creds.pat));
      setLastSavedTime(new Date().toLocaleTimeString());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    setUsername('');
    setPat('');
    setHasStored(false);
    setLastSavedTime(null);
    try {
      localStorage.removeItem(GIT_CREDENTIALS_STORAGE_KEY);
      setSavedSuccess(false);
    } catch {
      // ignore
    }
  };

  const maskedPatPreview = pat
    ? pat.length > 8
      ? `${pat.slice(0, 4)}${'•'.repeat(12)}${pat.slice(-4)}`
      : '••••••••'
    : '';

  return (
    <Card className="bg-card border-border shadow-sm col-span-1 md:col-span-2">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border/60">
              <GitBranch className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Git Credentials & Access
              </CardTitle>
              <CardDescription className="text-xs">
                Store Git username and Personal Access Token (PAT) for authenticated repository actions
              </CardDescription>
            </div>
          </div>
          {hasStored ? (
            <Badge variant="outline" className="text-emerald-400 border-border text-[10px] font-mono gap-1">
              <ShieldCheck className="h-3 w-3" /> Configured
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-border text-[10px] font-mono">
              Not Configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Git Username */}
            <div className="space-y-1.5">
              <Label htmlFor="git-username" className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Git Username</span>
                {username && (
                  <span className="text-[10px] font-mono text-muted-foreground">@{username}</span>
                )}
              </Label>
              <Input
                id="git-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. octocat or dev-operator"
                className="font-mono text-xs h-9 bg-background/50 border-border"
              />
            </div>

            {/* Git PAT */}
            <div className="space-y-1.5">
              <Label htmlFor="git-pat" className="text-xs font-medium text-foreground flex items-center justify-between">
                <span>Personal Access Token (PAT)</span>
                <span className="text-[10px] font-mono text-muted-foreground">GitHub / GitLab / Gitea</span>
              </Label>
              <div className="relative">
                <Input
                  id="git-pat"
                  type={showPat ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx or glpat-xxxxxxxxxxxx"
                  className="font-mono text-xs h-9 pr-9 bg-background/50 border-border"
                />
                <button
                  type="button"
                  onClick={() => setShowPat(!showPat)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  title={showPat ? 'Hide Token' : 'Show Token'}
                >
                  {showPat ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Stored Status summary info */}
          {hasStored && (
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-muted-foreground font-mono text-[11px] truncate">
                  Active PAT: <span className="text-foreground">{maskedPatPreview}</span>
                </span>
              </div>
              {lastSavedTime && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Saved at {lastSavedTime}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                className="h-8 px-4 text-xs font-medium gap-1.5 cursor-pointer shadow-xs"
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Save Credentials</span>
                  </>
                )}
              </Button>

              {hasStored && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-red-400 hover:bg-muted"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Stored locally in browser storage
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
