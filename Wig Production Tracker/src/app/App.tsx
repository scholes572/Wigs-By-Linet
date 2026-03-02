import React, { useState, useEffect } from 'react';
import { DailyProduction } from './components/DailyProduction';
import { WeeklyPayments } from './components/WeeklyPayments';
import { History } from './components/History';
import { Dashboard } from './components/Dashboard';
import { WorkerManagement } from './components/WorkerManagement';
import { Login } from './components/Login';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Scissors, LayoutDashboard, Calendar, DollarSign, History as HistoryIcon, Users, LogOut, Settings } from 'lucide-react';
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
    
    // Clear practice data but keep owner - run this only once
    const practiceDataCleared = localStorage.getItem('practice_data_cleared');
    if (practiceDataCleared !== 'true') {
      // Clear custom workers, keeping only owner in the database
      localStorage.removeItem('custom_workers');
      localStorage.removeItem('worker_name_changes');
      localStorage.removeItem('deleted_workers');
      localStorage.setItem('practice_data_cleared', 'true');
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

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This will refresh all worker information from the database.')) {
      localStorage.removeItem('custom_workers');
      localStorage.removeItem('worker_name_changes');
      localStorage.removeItem('deleted_workers');
      localStorage.removeItem('practice_data_cleared');
      localStorage.removeItem('wigs_active_tab');
      window.location.reload();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
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
              <div className="bg-violet-700 p-3 rounded-2xl shadow-lg">
                <Scissors className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-violet-700">
                  WIGS BY LINET
                </h1>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearData}
              className="rounded-xl text-gray-500 hover:text-gray-700"
              title="Refresh all data"
            >
              <Settings className="w-5 h-5" />
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
  const [activeTab, setActiveTab] = useState(() => {
    // Get saved tab from localStorage or default to dashboard
    return localStorage.getItem('wigs_active_tab') || 'dashboard';
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('wigs_active_tab', activeTab);
  }, [activeTab]);

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
        {/* Navigation - Fixed horizontal tabs */}
        <TabsList className="grid w-full grid-cols-5 bg-white p-1.5 rounded-2xl shadow-lg border border-gray-100 h-auto max-w-full mx-auto">
          <TabsTrigger 
            value="dashboard" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger 
            value="workers" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Workers</span>
          </TabsTrigger>
          <TabsTrigger 
            value="daily" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Daily</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2.5 px-1 text-xs sm:text-sm font-medium rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
          >
            <HistoryIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">History</span>
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
