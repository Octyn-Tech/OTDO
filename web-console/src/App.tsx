import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './Login';
import Dashboard from './Dashboard';

function MainRouter() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
