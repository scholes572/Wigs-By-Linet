import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DollarSign, Calendar, CheckCircle2, X, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getWorkerDisplayName, useWorkers } from '../../hooks/useWorkers';

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

interface WeeklySummary {
  workerId: string;
  workerName: string;
  frontal: number;
  closure: number;
  sewing: number;
  total: number;
}

export function WeeklyPayments() {
  const { workers } = useWorkers();
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  // Auto-detect current week (Monday to Sunday) on mount and when page becomes visible
  useEffect(() => {
    const setCurrentWeek = () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      setWeekStartDate(monday.toISOString().split('T')[0]);
      setWeekEndDate(sunday.toISOString().split('T')[0]);
    };
    
    setCurrentWeek();
    
    // Also refresh when page becomes visible (e.g., user switches back to app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setCurrentWeek();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (weekStartDate && weekEndDate) {
      fetchWeeklySummary();
    }
  }, [weekStartDate, weekEndDate, workers]);

  const fetchWeeklySummary = async () => {
    try {
      const response = await fetch(`${API_URL}/production/${weekStartDate}/${weekEndDate}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data: ProductionRecord[] = await response.json();
        
        // Aggregate by worker
        const summary: { [key: string]: WeeklySummary } = {};
        data.forEach((record) => {
          if (!summary[record.workerId]) {
            summary[record.workerId] = {
              workerId: record.workerId,
              workerName: record.workerName,
              frontal: 0,
              closure: 0,
              sewing: 0,
              total: 0,
            };
          }
          summary[record.workerId].frontal += record.frontal;
          summary[record.workerId].closure += record.closure;
          summary[record.workerId].sewing += record.sewing;
          summary[record.workerId].total += record.total;
        });
        
        setWeeklySummary(Object.values(summary).filter(w => {
          // Filter out owner if workers are loaded
          const worker = workers.find(worker => worker.id === w.workerId);
          // Only show if: workers not loaded yet OR worker is not the owner
          return !worker?.isOwner;
        }));
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const handlePayment = async (worker: WeeklySummary) => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          workerId: worker.workerId,
          workerName: worker.workerName,
          weekStartDate,
          weekEndDate,
          totalWigs: worker.total,
          amount: Number(paymentAmount),
          details: {
            frontal: worker.frontal,
            closure: worker.closure,
            sewing: worker.sewing,
          },
        }),
      });

      if (response.ok) {
        toast.success(`Payment of KSh ${Number(paymentAmount).toLocaleString()} recorded for ${worker.workerName}!`, {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
        });
        setPaymentAmount('');
        setSelectedWorker('');
      } else {
        toast.error('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const totalWeeklyWigs = weeklySummary.reduce((sum, worker) => sum + worker.total, 0);

  const formatDateRange = () => {
    if (!weekStartDate || !weekEndDate) return 'Loading...';
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Wallet className="w-8 h-8" />
              Weekly Payments 💰
            </h2>
            <p className="text-emerald-100 mt-1">Process payments for your team's hard work</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{totalWeeklyWigs}</p>
            <p className="text-emerald-200 text-sm">wigs produced this week</p>
          </div>
        </div>
      </div>

      {/* Week Display */}
      <Card className="bg-white border-0 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 font-medium">Current Week</p>
              <p className="text-2xl font-bold text-gray-900">{formatDateRange()}</p>
            </div>
            <Button 
              onClick={() => {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const monday = new Date(today);
                monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                setWeekStartDate(monday.toISOString().split('T')[0]);
                setWeekEndDate(sunday.toISOString().split('T')[0]);
              }}
              className="ml-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              This Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table - Mobile Responsive */}
      <Card className="bg-white border-0 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile: Horizontal scroll with visual hint */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
            <table className="w-full min-w-[700px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">Worker</th>
                  <th className="text-center py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frontal</th>
                  <th className="text-center py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closure</th>
                  <th className="text-center py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-yellow-50">Sewing</th>
                  <th className="text-center py-4 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeklySummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16">
                      <div className="text-gray-400">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <DollarSign className="w-8 h-8" />
                        </div>
                        <p className="font-medium">No production records for this week</p>
                        <p className="text-sm mt-1">Add production records to see payment summary</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  weeklySummary.map((worker) => (
                    <tr key={worker.workerId} className="hover:bg-emerald-50 transition-colors">
                      <td className="py-4 px-4 sticky left-0 bg-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white">
                            {getWorkerDisplayName(worker.workerId, worker.workerName).charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">{getWorkerDisplayName(worker.workerId, worker.workerName)}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-3 text-gray-600 font-medium">{worker.frontal}</td>
                      <td className="text-center py-4 px-3 text-gray-600 font-medium">{worker.closure}</td>
                      <td className="text-center py-4 px-3 font-medium bg-yellow-50 text-yellow-700">{worker.sewing || '-'}</td>
                      <td className="text-center py-4 px-3">
                        <span className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm px-3 py-1.5 rounded-full">
                          {worker.total}
                        </span>
                      </td>
                      <td className="py-4 px-4 sticky right-0 bg-white">
                        {selectedWorker === worker.workerId ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number"
                              placeholder="KSh"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="w-24 h-9 text-sm font-bold border-emerald-200 rounded-lg"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handlePayment(worker)} disabled={loading} className="h-9 bg-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedWorker(''); setPaymentAmount(''); }} className="h-9">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 font-medium">
                                <DollarSign className="w-4 h-4 mr-1" /> Pay
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Record a payment to <span className="font-semibold">{getWorkerDisplayName(worker.workerId, worker.workerName)}</span> for {worker.total} wigs?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => setSelectedWorker(worker.workerId)}>
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {weeklySummary.length > 0 && (
                <tfoot>
                  <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <td className="py-4 px-4 font-bold text-gray-900 sticky left-0 bg-emerald-50">TOTAL</td>
                    <td className="text-center py-4 px-3 font-bold text-gray-900">
                      {weeklySummary.reduce((sum, w) => sum + w.frontal, 0)}
                    </td>
                    <td className="text-center py-4 px-3 font-bold text-gray-900">
                      {weeklySummary.reduce((sum, w) => sum + w.closure, 0)}
                    </td>
                    <td className="text-center py-4 px-3 font-bold text-gray-900 bg-yellow-50">
                      {weeklySummary.reduce((sum, w) => sum + w.sewing, 0) || '-'}
                    </td>
                    <td className="text-center py-4 px-3">
                      <span className="inline-flex items-center justify-center bg-emerald-600 text-white font-bold text-sm px-3 py-1.5 rounded-full">
                        {totalWeeklyWigs}
                      </span>
                    </td>
                    <td className="sticky right-0 bg-emerald-50"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {/* Mobile scroll hint */}
          <div className="md:hidden text-center py-2 text-xs text-gray-400">
            ← Swipe to see all columns →
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
