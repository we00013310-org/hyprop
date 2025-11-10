import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { TradingInterface } from './components/Trading/TradingInterface';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'trading'>('dashboard');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleOpenTrading = (accountId: string) => {
    setSelectedAccountId(accountId);
    setCurrentView('trading');
  };

  const handleCloseTrade = () => {
    setCurrentView('dashboard');
    setSelectedAccountId(null);
  };

  if (currentView === 'trading' && selectedAccountId) {
    return <TradingInterface accountId={selectedAccountId} onClose={handleCloseTrade} />;
  }

  return <Dashboard onOpenTrading={handleOpenTrading} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
