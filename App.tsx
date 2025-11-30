import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { Welcome } from './pages/Welcome';
import { AppRoute, UserProfile } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session
    const existingUser = storageService.getUser();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
  };

  const renderPage = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <Dashboard onNavigate={setCurrentRoute} user={user!} />;
      case AppRoute.PLAN:
        return <Planner />;
      default:
        return <Dashboard onNavigate={setCurrentRoute} user={user!} />;
    }
  };

  if (isLoading) return null;

  if (!user) {
    return <Welcome onLogin={handleLogin} />;
  }

  return (
    <Layout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderPage()}
    </Layout>
  );
};

export default App;