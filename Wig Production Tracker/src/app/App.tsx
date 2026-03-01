import React, { useState, useEffect } from 'react';
import { DailyProduction } from './components/DailyProduction';
import { WeeklyPayments } from './components/WeeklyPayments';
import { History } from './components/History';
import { Dashboard } from './components/Dashboard';
import { WorkerManagement } from './components/WorkerManagement';
import { Login } from './components/Login';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Scissors, LayoutDashboard, Calendar, DollarSign, History as HistoryIcon, Users, LogOut } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const loggedIn = localStorage.getItem('wigs_by_linet_logged_in');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('wigs_by_linet_logged_in');
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-3 rounded-2xl shadow-lg shadow-purple-500/30">
                <Scissors className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                  WIGS BY LINET
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Production Tracker
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl text-gray-500 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <MainContent />
      <Toaster position="top-right" />
    </div>
  );
}

function MainContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      switch (e.key) {
        case '1':
          setActiveTab('dashboard');
          break;
        case '2':
          setActiveTab('workers');
          break;
        case '3':
          setActiveTab('daily');
          break;
        case '4':
          setActiveTab('payments');
          break;
        case '5':
          setActiveTab('history');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Modern Tab List */}
        <TabsList className="grid w-full grid-cols-5 bg-white p-2 rounded-2xl shadow-lg border border-gray-100 h-auto">
          <TabsTrigger 
            value="dashboard" 
            className="flex flex-col md:flex-row items-center gap-2 py-3 px-2 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="workers" 
            className="flex flex-col md:flex-row items-center gap-2 py-3 px-2 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Users className="w-5 h-5" />
            <span>Workers</span>
          </TabsTrigger>
          <TabsTrigger 
            value="daily" 
            className="flex flex-col md:flex-row items-center gap-2 py-3 px-2 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Calendar className="w-5 h-5" />
            <span>Daily</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="flex flex-col md:flex-row items-center gap-2 py-3 px-2 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <DollarSign className="w-5 h-5" />
            <span>Payments</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex flex-col md:flex-row items-center gap-2 py-3 px-2 text-sm font-medium rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-600 data-[state=active]:via-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <HistoryIcon className="w-5 h-5" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <Dashboard setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="workers" className="mt-0">
          <WorkerManagement setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="daily" className="mt-0">
          <DailyProduction />
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          <WeeklyPayments />
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <History />
        </TabsContent>
      </Tabs>
    </main>
  );
}
