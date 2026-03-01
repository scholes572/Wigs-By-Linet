import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { DollarSign, Calendar, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
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

interface WeeklySummary {
  workerId: string;
  workerName: string;
  frontal: number;
  closure: number;
  sewing: number;
  total: number;
}

export function WeeklyPayments() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  // Auto-detect current week (Monday to Sunday)
  useEffect(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    setWeekStartDate(monday.toISOString().split('T')[0]);
    setWeekEndDate(sunday.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (weekStartDate && weekEndDate) {
      fetchWeeklySummary();
    }
  }, [weekStartDate, weekEndDate]);

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}/workers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkers(data);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

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
        
        setWeeklySummary(Object.values(summary));
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
        toast.success(`Payment recorded for ${worker.workerName}`);
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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg md:text-xl">Weekly Payment Summary</CardTitle>
          <CardDescription className="text-sm">Review and process weekly payments (Monday - Sunday)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Current Week Display */}
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 rounded-full p-2">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Week</p>
                  <p className="text-lg font-bold text-purple-700">
                    {weekStartDate && weekEndDate 
                      ? `${new Date(weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(weekEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Loading...'
                    }
                  </p>
                </div>
              </div>
              <DollarSign className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>

          {weeklySummary.length > 0 && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Weekly Production</p>
                  <p className="text-3xl font-bold text-purple-700">{totalWeeklyWigs} wigs</p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-600 opacity-50" />
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Worker</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Frontal</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Closure</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Sewing</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Payment</th>
                </tr>
              </thead>
              <tbody>
                {weeklySummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="text-gray-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No production records for this week</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  weeklySummary.map((worker) => (
                    <tr key={worker.workerId} className="border-b hover:bg-purple-50 transition-colors">
                      <td className="py-3 px-2 md:px-4 font-semibold text-xs md:text-sm">{worker.workerName}</td>
                      <td className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{worker.frontal}</td>
                      <td className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{worker.closure}</td>
                      <td className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{worker.sewing}</td>
                      <td className="text-center py-3 px-2 md:px-4">
                        <span className="inline-flex items-center justify-center bg-purple-100 text-purple-700 font-bold text-xs md:text-sm px-3 py-1 rounded-full">
                          {worker.total}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2 md:px-4">
                        {selectedWorker === worker.workerId ? (
                          <div className="flex items-center gap-2 justify-center flex-wrap">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">KSh</span>
                              <Input
                                type="number"
                                placeholder="0"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-28 md:w-36 text-sm pl-10 h-9"
                              />
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handlePayment(worker)}
                              disabled={loading}
                              className="h-9 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedWorker('');
                                setPaymentAmount('');
                              }}
                              className="h-9"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                <DollarSign className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                Record Payment
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You are about to record a payment of <span className="font-semibold">KSh {worker.total * 50}</span> to <span className="font-semibold">{worker.workerName}</span> for {worker.total} wigs produced this week.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => {
                                  setPaymentAmount(String(worker.total * 50));
                                  setSelectedWorker(worker.workerId);
                                }}>
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
                  <tr className="border-t-2 bg-gradient-to-r from-purple-100 to-pink-100 font-bold">
                    <td className="py-4 px-2 md:px-4 text-xs md:text-sm">WEEK TOTAL</td>
                    <td className="text-center py-4 px-2 md:px-4 text-xs md:text-sm">
                      {weeklySummary.reduce((sum, w) => sum + w.frontal, 0)}
                    </td>
                    <td className="text-center py-4 px-2 md:px-4 text-xs md:text-sm">
                      {weeklySummary.reduce((sum, w) => sum + w.closure, 0)}
                    </td>
                    <td className="text-center py-4 px-2 md:px-4 text-xs md:text-sm">
                      {weeklySummary.reduce((sum, w) => sum + w.sewing, 0)}
                    </td>
                    <td className="text-center py-4 px-2 md:px-4">
                      <span className="inline-flex items-center justify-center bg-purple-600 text-white font-bold text-sm px-4 py-1.5 rounded-full">
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

      <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-4 md:p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="bg-purple-600 rounded-full p-2">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-purple-900 mb-1">Payment Schedule</p>
            <p className="text-purple-800 text-sm">Payments are processed every Sunday</p>
          </div>
        </div>
      </div>
    </div>
  );
}