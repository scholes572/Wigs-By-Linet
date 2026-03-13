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

interface Payment {
  id: string;
  workerId: string;
  workerName: string;
  weekStartDate: string;
  weekEndDate: string;
  totalWigs: number;
  amount: number;
  details: {
    frontal: number;
    closure: number;
    sewing: number;
  };
  paidDate: string;
}

export function WeeklyPayments() {
  const { workers } = useWorkers();
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary[]>([]);
  const [paidWorkers, setPaidWorkers] = useState<Set<string>>(new Set());
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
      if (weekStartDate && weekEndDate) {
        fetchPaidWorkers(weekStartDate, weekEndDate);
      }
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
          const worker = workers.find(worker => worker.id === w.workerId);
          // Only show active workers who are not the owner
          return worker && worker.active && !worker.isOwner;
        }));
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    }
  };

  const fetchPaidWorkers = async (startDate?: string, endDate?: string) => {
    const currentStartDate = startDate || weekStartDate;
    const currentEndDate = endDate || weekEndDate;
    
    if (!currentStartDate || !currentEndDate) return;
    
    try {
      // Use existing /payments endpoint and filter on client side
      const response = await fetch(`${API_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const allPayments: Payment[] = await response.json();
        // Filter payments for the selected week - compare as YYYY-MM-DD strings
        const weekPayments = allPayments.filter(p => {
          const paymentStart = p.weekStartDate ? p.weekStartDate.split('T')[0] : '';
          const paymentEnd = p.weekEndDate ? p.weekEndDate.split('T')[0] : '';
          return paymentStart === currentStartDate && paymentEnd === currentEndDate;
        });
        const paidWorkerIds = new Set(weekPayments.map(p => p.workerId));
        setPaidWorkers(paidWorkerIds);
      }
    } catch (error) {
      console.error('Error fetching paid workers:', error);
    }
  };

  const isWorkerPaid = (workerId: string) => paidWorkers.has(workerId);

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
        const data = await response.json();
        toast.success(`Payment of KSh ${Number(paymentAmount).toLocaleString()} recorded for ${worker.workerName}!`, {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
        });
        setPaymentAmount('');
        setSelectedWorker('');
        
        // Immediately mark worker as paid in local state
        const newPaidWorkers = new Set(paidWorkers);
        newPaidWorkers.add(worker.workerId);
        setPaidWorkers(newPaidWorkers);
        
        // Also refresh from server
        if (weekStartDate && weekEndDate) {
          fetchPaidWorkers(weekStartDate, weekEndDate);
        }
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

  const goToThisWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    setWeekStartDate(monday.toISOString().split('T')[0]);
    setWeekEndDate(sunday.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Weekly Payments</h2>
            <p className="text-blue-100 mt-1">Process payments for your team</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-3xl font-bold">{totalWeeklyWigs}</p>
            <p className="text-blue-200 text-sm">Total Wigs</p>
          </div>
        </div>
      </div>

      {/* Current Week */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Week</p>
                <p className="text-lg font-semibold">{formatDateRange()}</p>
              </div>
            </div>
            <Button 
              onClick={goToThisWeek}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              This Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile: stacked cards */}
          <div className="space-y-3 p-4 md:hidden">
            {weeklySummary.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <DollarSign className="w-10 h-10 mx-auto mb-2" />
                <p>No production records for this week</p>
              </div>
            ) : (
              weeklySummary.map((worker) => (
                <div key={worker.workerId} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                        {getWorkerDisplayName(worker.workerId, worker.workerName).charAt(0)}
                      </div>
                      <span className="font-semibold">{getWorkerDisplayName(worker.workerId, worker.workerName)}</span>
                    </div>
                    <span className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full">
                      {worker.total}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-xs text-gray-500 uppercase">Frontal</p>
                      <p className="font-bold">{worker.frontal}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-xs text-gray-500 uppercase">Closure</p>
                      <p className="font-bold">{worker.closure}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg py-2">
                      <p className="text-xs text-gray-500 uppercase">Sewing</p>
                      <p className="font-bold">{worker.sewing || '-'}</p>
                    </div>
                  </div>
                  {selectedWorker === worker.workerId ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="KSh"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="flex-1 h-10 text-sm font-bold"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handlePayment(worker)} disabled={loading} className="h-10 bg-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setSelectedWorker(''); setPaymentAmount(''); }} className="h-10">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setSelectedWorker(worker.workerId)}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-green-600 disabled:cursor-not-allowed"
                      disabled={isWorkerPaid(worker.workerId)}
                    >
                      {isWorkerPaid(worker.workerId) ? (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Paid</>
                      ) : (
                        <><DollarSign className="w-4 h-4 mr-2" /> Pay Worker</>
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop: table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">Frontal</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">Closure</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">Sewing</th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {weeklySummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="text-gray-400">
                        <DollarSign className="w-10 h-10 mx-auto mb-2" />
                        <p>No production records for this week</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  weeklySummary.map((worker) => (
                    <tr key={worker.workerId} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                            {getWorkerDisplayName(worker.workerId, worker.workerName).charAt(0)}
                          </div>
                          <span className="font-semibold">{getWorkerDisplayName(worker.workerId, worker.workerName)}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">{worker.frontal}</td>
                      <td className="text-center py-3 px-3">{worker.closure}</td>
                      <td className="text-center py-3 px-3">{worker.sewing || '-'}</td>
                      <td className="text-center py-3 px-3">
                        <span className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full">
                          {worker.total}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {selectedWorker === worker.workerId ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Input
                              type="number"
                              placeholder="KSh"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              className="w-24 h-8 text-sm"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handlePayment(worker)} disabled={loading} className="h-8 bg-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setSelectedWorker(''); setPaymentAmount(''); }} className="h-8">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-green-600 disabled:cursor-not-allowed"
                                disabled={isWorkerPaid(worker.workerId)}
                              >
                                {isWorkerPaid(worker.workerId) ? (
                                  <><CheckCircle2 className="w-4 h-4 mr-1" /> Paid</>
                                ) : (
                                  <><DollarSign className="w-4 h-4 mr-1" /> Pay</>
                                )}
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
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 font-bold">TOTAL</td>
                    <td className="text-center py-3 px-3 font-bold">
                      {weeklySummary.reduce((sum, w) => sum + w.frontal, 0)}
                    </td>
                    <td className="text-center py-3 px-3 font-bold">
                      {weeklySummary.reduce((sum, w) => sum + w.closure, 0)}
                    </td>
                    <td className="text-center py-3 px-3 font-bold">
                      {weeklySummary.reduce((sum, w) => sum + w.sewing, 0) || '-'}
                    </td>
                    <td className="text-center py-3 px-3">
                      <span className="bg-blue-600 text-white font-bold text-sm px-3 py-1 rounded-full">
                        {totalWeeklyWigs}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
