import { Route, Switch, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthForm } from "./components/Auth/AuthForm";
import { Dashboard } from "./components/Dashboard/Dashboard";
import TradingPage from "./components/Trading/TradingPage";
import DemoSettingsPage from "./components/Demo/DemoSettingsPage";
import { LeaderboardPage } from "./components/Leaderboard/LeaderboardPage";
import { ReferralsPage } from "./components/Referrals/ReferralsPage";
import { Navbar } from "./components/Navbar";
import NewAccountPage from "./pages/NewAccountPage/NewAccountPage";
import AccountTradingPage from "./pages/AccountTradingPage/AccountTradingPage";
import { Button } from "./components/ui";

function AppContent() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new-account" component={NewAccountPage} />
        <Route path="/trading/:accountId" component={TradingPage} />
        <Route path="/account-trading" component={AccountTradingPage} />

        <Route path="/leaderboard" component={LeaderboardPage} />

        <Route path="/referrals" component={ReferralsPage} />

        <Route path="/demo" component={DemoSettingsPage} />

        {/* 404 fallback */}
        <Route>
          <div className="min-h-screen flex items-center justify-center text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="text-slate-400 mb-4">Page not found</p>
              <Button size="lg" onClick={() => setLocation("/")}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
