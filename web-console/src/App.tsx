import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import Dashboard from './Dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, Lock } from 'lucide-react';

function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Card className="bg-slate-900 border-slate-800 text-slate-100 w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-cyan-500/10 p-3 rounded-full w-fit text-cyan-400">
            <Server className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">OTDO Console Authentication</CardTitle>
          <p className="text-xs text-slate-400">Sign in to access secure server telemetry</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter operator handle..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <Button
            onClick={() => username && login(username)}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
          >
            <Lock className="w-4 h-4 mr-2" /> Authenticate Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MainRouter() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}