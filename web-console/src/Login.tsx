import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldCheck, ArrowRight, Terminal } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [handle, setHandle] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setError('Operator handle is required');
      return;
    }

    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const ok = login(handle, password);
      if (!ok) {
        setError('Authentication failed. Check your handle.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-background select-none overflow-hidden">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.04] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 space-y-6">
        {/* Brand identity */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-11 w-11 rounded-xl bg-card border border-border flex items-center justify-center shadow-lg ring-1 ring-white/10">
            <Activity className="h-5 w-5 text-foreground animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">OTDO System, All in One</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Operator Authentication Console</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border bg-card/90 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-foreground">Operator Login</CardTitle>
              <Badge variant="outline" className="text-[10px] tracking-wider uppercase text-muted-foreground">
                v1.0.0
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Sign in with your node handle to view live telemetry
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="handle" className="text-xs font-medium text-foreground">
                  Operator Handle
                </Label>
                <div className="relative">
                  <Input
                    id="handle"
                    type="text"
                    autoFocus
                    placeholder="e.g. admin or operator"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    className="h-9 bg-background/50 border-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="passkey" className="text-xs font-medium text-foreground">
                    Security Passkey
                  </Label>
                  <span className="text-[11px] text-muted-foreground font-mono">optional</span>
                </div>
                <Input
                  id="passkey"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 bg-background/50 border-input text-xs font-mono"
                />
              </div>

              <div className="rounded-md border border-border/60 bg-muted/30 p-2.5 flex items-start gap-2.5">
                <Terminal className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-[11px] text-muted-foreground leading-relaxed">
                  Fast login: Default operator handle is <span className="font-mono text-foreground font-medium">admin</span>. Passkey is optional in dev mode.
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-9 text-xs font-medium transition-all group"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Local Telemetry Mesh • Encrypted Queue</span>
        </div>
      </div>
    </div>
  );
}

