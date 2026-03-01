import React, { useState, useEffect } from 'react';
import { DailyProduction } from './components/DailyProduction';
import { WeeklyPayments } from './components/WeeklyPayments';
import { History } from './components/History';
import { Dashboard } from './components/Dashboard';
import { WorkerManagement } from './components/WorkerManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Scissors, LayoutDashboard, Calendar, DollarSign, History as HistoryIcon, Users } from 'lucide-react';
import { Toaster } from './components/ui/sonner';

export default function App() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header 
        className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50"
        role="banner"
      >
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="bg-gradient-to-br from-purple-600 to-pink-600 p-2.5 rounded-xl shadow-lg"
                aria-hidden="true"
              >
                <Scissors className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  WIGS BY LINET
                </h1>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">Business Management System</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white p-1.5 shadow-md h-auto">
            <TabsTrigger 
              value="dashboard" 
              className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 py-3 text-xs md:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
            >
              <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="workers" 
              className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 py-3 text-xs md:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span>Workers</span>
            </TabsTrigger>
            <TabsTrigger 
              value="daily" 
              className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 py-3 text-xs md:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
            >
              <Calendar className="w-4 h-4 md:w-5 md:h-5" />
              <span>Daily</span>
            </TabsTrigger>
            <TabsTrigger 
              value="payments" 
              className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 py-3 text-xs md:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
            >
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
              <span>Payments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 py-3 text-xs md:text-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-600 data-[state=active]:to-pink-600"
            >
              <HistoryIcon className="w-4 h-4 md:w-5 md:h-5" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-0">
            <Dashboard />
          </TabsContent>

          <TabsContent value="workers" className="mt-0">
            <WorkerManagement />
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

        {/* Keyboard shortcuts hint */}
        <p className="text-center text-xs text-gray-400 mt-4" aria-hidden="true">
          Press 1-5 to switch tabs • Ctrl+D for Dashboard
        </p>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}