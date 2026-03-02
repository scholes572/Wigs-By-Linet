import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Users, Package, DollarSign, Award, Calendar, ArrowUp, ArrowDown } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getWorkerDisplayName } from '../../hooks/useWorkers';
import { Button } from './ui/button';

interface DashboardProps {
  setActiveTab?: (tab: string) => void;
}

interface Worker {
  id: string;
  name: string;
  active: boolean;
  isOwner?: boolean;
}

interface ProductionRecord {
  workerId: string;
  workerName: string;
  date: string;
  frontal: number;
  closure: number;
  sewing: number;
  total: number;
}

interface PaymentRecord {
  workerId: string;
  workerName: string;
  amount: number;
  totalWigs: number;
  paidDate: string;
}

interface WorkerStats {
  workerId: string;
  workerName: string;
  totalWigs: number;
  totalPaid: number;
}

export function Dashboard({ setActiveTab }: DashboardProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [todayProduction, setTodayProduction] = useState<ProductionRecord[]>([]);
  const [weekProduction, setWeekProduction] = useState<ProductionRecord[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [topPerformers, setTopPerformers] = useState<WorkerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameRefresh, setNameRefresh] = useState(0);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "Good morning, Linet! ☀️";
    if (hour >= 12 && hour < 17) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  };
  const greeting = getGreeting();

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  useEffect(() => {
    fetchDashboardData();
    
    // Listen for worker name changes
    const handleStorageChange = () => {
      setNameRefresh(prev => prev + 1);
      fetchDashboardData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workerNameChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workerNameChanged', handleStorageChange);
    };
  }, [nameRefresh]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWorkers(),
        fetchTodayProduction(),
        fetchWeekProduction(),
        fetchRecentPayments(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}/workers`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        
        // Get custom workers from localStorage
        const customWorkers = JSON.parse(localStorage.getItem('custom_workers') || '[]');
        const deletedWorkers = JSON.parse(localStorage.getItem('deleted_workers') || '[]');
        
        // Merge API data with localStorage data to preserve active status
        // and filter out deleted workers
        const mergedWorkers = data
          .filter((worker: Worker) => !deletedWorkers.includes(worker.id))
          .map((worker: Worker) => {
            const customWorker = customWorkers.find((w: Worker) => w.id === worker.id);
            if (customWorker) {
              return { ...worker, active: customWorker.active };
            }
            return worker;
          });
        
        setWorkers(mergedWorkers);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchTodayProduction = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await fetch(`${API_URL}/production/${today}/${today}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTodayProduction(data);
      }
    } catch (error) {
      console.error('Error fetching today production:', error);
    }
  };

  const fetchWeekProduction = async () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = today.toISOString().split('T')[0];

    try {
      const response = await fetch(`${API_URL}/production/${weekStart}/${weekEnd}`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWeekProduction(data);
        calculateTopPerformers(data);
      }
    } catch (error) {
      console.error('Error fetching week production:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const response = await fetch(`${API_URL}/payments`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentPayments(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const calculateTopPerformers = (production: ProductionRecord[]) => {
    const stats: { [key: string]: WorkerStats } = {};
    
    production.forEach((record) => {
      if (!stats[record.workerId]) {
        stats[record.workerId] = {
          workerId: record.workerId,
          workerName: getWorkerDisplayName(record.workerId, record.workerName),
          totalWigs: 0,
          totalPaid: 0,
        };
      }
      stats[record.workerId].totalWigs += record.total;
    });

    const sorted = Object.values(stats)
      .sort((a, b) => b.totalWigs - a.totalWigs)
      .slice(0, 3);
    
    setTopPerformers(sorted);
  };

  const todayTotal = todayProduction.reduce((sum, r) => sum + r.total, 0);
  const weekTotal = weekProduction.reduce((sum, r) => sum + r.total, 0);
  const totalPayments = recentPayments.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-violet-700 rounded-2xl p-6 text-white shadow-xl">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold">{greeting}</h2>
          <p className="text-violet-200 mt-1">Here's what's happening with your production</p>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 gap-3 mt-6">
          <Button 
            onClick={() => setActiveTab?.('daily')}
            className="h-12 text-base font-semibold bg-white text-violet-700 hover:bg-gray-100 border-0 rounded-xl flex items-center justify-center gap-2"
          >
            <span>➕</span> Record Production
          </Button>
          {weekTotal > 0 && (
            <Button 
              onClick={() => setActiveTab?.('payments')}
              className="h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 border-0 rounded-xl flex items-center justify-center gap-2"
            >
              <span>💰</span> Pay This Week
            </Button>
          )}
          <Button 
            onClick={() => setActiveTab?.('workers')}
            className="h-12 text-base font-semibold bg-slate-100 text-slate-800 hover:bg-gray-200 border border-slate-200 rounded-xl flex items-center justify-center gap-2"
          >
            <span>👥</span> Add Worker
          </Button>
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Today's Production</p>
                <p className="text-4xl font-bold text-violet-700 mt-2">{todayTotal}</p>
                <p className="text-xs text-gray-400 mt-1">wigs completed</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">This Week</p>
                <p className="text-4xl font-bold text-violet-700 mt-2">{weekTotal}</p>
                <p className="text-xs text-gray-400 mt-1">total wigs</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Recent Payments</p>
                <p className="text-3xl font-bold text-violet-700 mt-2">{formatCurrency(totalPayments)}</p>
                <p className="text-xs text-gray-400 mt-1">last 5 payments</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Workers</p>
                <p className="text-4xl font-bold text-violet-700 mt-2">{workers.filter(w => w.active).length}</p>
                <p className="text-xs text-gray-400 mt-1">team members</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Users className="w-7 h-7 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Production */}
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              Today's Production
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {todayProduction.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No production recorded today</p>
                <p className="text-gray-300 text-sm mt-1">Add production to see it here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayProduction.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-2xl hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        'bg-violet-500'
                      }`}>
                        {record.workerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{getWorkerDisplayName(record.workerId, record.workerName)}</p>
                        <p className="text-xs text-gray-500">
                          F: {record.frontal} • C: {record.closure} • S: {record.sewing || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {record.total}
                      </div>
                      <p className="text-xs text-gray-400">wigs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="bg-white border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-violet-600" />
              </div>
              Top Performers (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {topPerformers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No data available</p>
                <p className="text-gray-300 text-sm mt-1">Production data will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((worker, index) => (
                  <div
                    key={worker.workerId}
                    className={`flex items-center gap-4 p-4 rounded-2xl ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100' 
                        : 'bg-gradient-to-r from-gray-50 to-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : 'bg-violet-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{getWorkerDisplayName(worker.workerId, worker.workerName)}</p>
                      <p className="text-sm text-gray-500">{worker.totalWigs} wigs this week</p>
                    </div>
                    {index === 0 && (
                      <Award className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <DollarSign className="w-10 h-10 mx-auto mb-2" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden space-y-2 p-4">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                        {getWorkerDisplayName(payment.workerId, payment.workerName).charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{getWorkerDisplayName(payment.workerId, payment.workerName)}</p>
                        <p className="text-xs text-gray-500">{payment.totalWigs} wigs • {formatDate(payment.paidDate)}</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Worker</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Wigs</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentPayments.map((payment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                              {getWorkerDisplayName(payment.workerId, payment.workerName).charAt(0)}
                            </div>
                            <span className="font-medium">{getWorkerDisplayName(payment.workerId, payment.workerName)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{payment.totalWigs}</td>
                        <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(payment.amount)}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-500">{formatDate(payment.paidDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
