import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Users, Package, DollarSign, Award, Calendar } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

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

export function Dashboard() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [todayProduction, setTodayProduction] = useState<ProductionRecord[]>([]);
  const [weekProduction, setWeekProduction] = useState<ProductionRecord[]>([]);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [topPerformers, setTopPerformers] = useState<WorkerStats[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
        setWorkers(data);
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
          workerName: record.workerName,
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
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Today's Production</CardTitle>
              <Calendar className="w-5 h-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold">{todayTotal}</div>
            <p className="text-xs opacity-80 mt-1">wigs completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">This Week</CardTitle>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold">{weekTotal}</div>
            <p className="text-xs opacity-80 mt-1">total wigs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Recent Payments</CardTitle>
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{formatCurrency(totalPayments)}</div>
            <p className="text-xs opacity-80 mt-1">last 5 payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium opacity-90">Active Workers</CardTitle>
              <Users className="w-5 h-5 opacity-80" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold">{workers.length}</div>
            <p className="text-xs opacity-80 mt-1">team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Production */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-purple-600" />
              Today's Production
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {todayProduction.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No production recorded today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayProduction.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{record.workerName}</p>
                      <p className="text-xs text-gray-500">
                        F:{record.frontal} • C:{record.closure} • S:{record.sewing}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{record.total}</div>
                      <p className="text-xs text-gray-500">wigs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="shadow-lg border-0">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="w-5 h-5 text-purple-600" />
              Top Performers (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {topPerformers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((worker, index) => (
                  <div
                    key={worker.workerId}
                    className="flex items-center gap-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                          index === 0
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-300 to-gray-500'
                            : 'bg-gradient-to-br from-orange-400 to-orange-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{worker.workerName}</p>
                      <p className="text-sm text-gray-600">{worker.totalWigs} wigs this week</p>
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
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5 text-purple-600" />
            Recent Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {recentPayments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No payments recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3 font-semibold">Worker</th>
                    <th className="pb-3 font-semibold text-right">Wigs</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((payment, index) => (
                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium">{payment.workerName}</td>
                      <td className="py-3 text-right text-gray-600">{payment.totalWigs}</td>
                      <td className="py-3 text-right font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-500">
                        {formatDate(payment.paidDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
