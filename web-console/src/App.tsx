import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import Login from './Login';
import Dashboard from './Dashboard';

function MainRouter() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider delay={0}>
        <MainRouter />
      </TooltipProvider>
    </AuthProvider>
  );
}
