import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Planner } from './pages/Planner';
import { Learn } from './pages/Learn';
import { AppRoute } from './types';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);

  const renderPage = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <Dashboard onNavigate={setCurrentRoute} />;
      case AppRoute.PLAN:
        return <Planner />;
      case AppRoute.LEARN:
        return <Learn />;
      default:
        return <Dashboard onNavigate={setCurrentRoute} />;
    }
  };

  return (
    <Layout activeRoute={currentRoute} onNavigate={setCurrentRoute}>
      {renderPage()}
    </Layout>
  );
};

export default App;