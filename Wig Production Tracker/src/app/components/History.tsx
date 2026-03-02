import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { History as HistoryIcon, DollarSign, Package, Download, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getWorkerDisplayName } from '../../hooks/useWorkers';

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
  timestamp: string;
}

interface PaymentRecord {
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

export function History() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('all');
  const [allPayments, setAllPayments] = useState<PaymentRecord[]>([]);
  const [workerHistory, setWorkerHistory] = useState<{
    production: ProductionRecord[];
    payments: PaymentRecord[];
  }>({ production: [], payments: [] });
  const [loading, setLoading] = useState(false);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  useEffect(() => {
    fetchWorkers();
    fetchAllPayments();
  }, []);

  useEffect(() => {
    if (selectedWorker && selectedWorker !== 'all') {
      fetchWorkerHistory(selectedWorker);
    }
  }, [selectedWorker]);

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}/workers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Get deleted workers from localStorage
        const deletedWorkers = JSON.parse(localStorage.getItem('deleted_workers') || '[]');
        // Filter out deleted workers
        const filteredWorkers = data.filter((worker: Worker) => !deletedWorkers.includes(worker.id));
        setWorkers(filteredWorkers);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    }
  };

  const fetchAllPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payments`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerHistory = async (workerId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/worker/${workerId}/history`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkerHistory(data);
      }
    } catch (error) {
      console.error('Error fetching worker history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const exportToCSV = () => {
    const payments = selectedWorker === 'all' ? allPayments : workerHistory.payments;
    
    if (payments.length === 0) {
      toast.error('No payment data to export');
      return;
    }

    const headers = ['Worker', 'Week Start', 'Week End', 'Total Wigs', 'Frontal', 'Closure', 'Sewing', 'Amount', 'Paid Date'];
    const rows = payments.map(payment => [
      payment.workerName,
      payment.weekStartDate,
      payment.weekEndDate,
      payment.totalWigs,
      payment.details.frontal,
      payment.details.closure,
      payment.details.sewing,
      payment.amount,
      payment.paidDate
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Payment history exported successfully');
  };

  const displayPayments = selectedWorker === 'all' ? allPayments : workerHistory.payments;
  const totalPaid = displayPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-violet-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <HistoryIcon className="w-8 h-8" />
              Payment History 📋
            </h2>
            <p className="text-violet-200 mt-1">View and export all payment records</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{formatCurrency(totalPaid)}</p>
            <p className="text-violet-300 text-sm">total payments</p>
          </div>
        </div>
      </div>

      {/* Filter & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-600" />
            Filter by Worker
          </Label>
          <Select value={selectedWorker} onValueChange={setSelectedWorker}>
            <SelectTrigger className="h-14 text-lg border-2 border-gray-100 rounded-xl focus:border-violet-500 focus:ring-0 bg-white">
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-lg py-3">
                <div className="flex items-center gap-2">
                  <span>📊</span>
                  <span>All Workers</span>
                </div>
              </SelectItem>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id} className="text-lg py-3">
                  <div className="flex items-center gap-2">
                    <span>{getWorkerDisplayName(worker.id, worker.name)}</span>
                    {worker.isOwner && <span className="text-yellow-500">👑</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-violet-600 text-white border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-200 text-sm">Total Payments</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
                <p className="text-violet-300 text-xs mt-1">{displayPayments.length} payments</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedWorker !== 'all' && (
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl h-14">
            <TabsTrigger value="payments" className="text-lg rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment History
            </TabsTrigger>
            <TabsTrigger value="production" className="text-lg rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md">
              <Package className="w-5 h-5 mr-2" />
              Production History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-0">
            <Card className="bg-white border border-gray-100 shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {workerHistory.payments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-400 font-medium">No payment history</p>
                    </div>
                  ) : (
                    workerHistory.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="border-2 border-gray-100 rounded-2xl p-5 hover:border-violet-200 hover:bg-violet-50 transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                              <DollarSign className="w-6 h-6 text-violet-600" />
                            </div>
                            <div>
                              <div className="font-bold text-xl text-gray-900">
                                {formatCurrency(payment.amount)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(payment.weekStartDate)} - {formatDate(payment.weekEndDate)}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 px-4 py-2">
                            Paid on {formatDate(payment.paidDate)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="bg-gray-100 px-3 py-1.5 rounded-lg">Total: {payment.totalWigs}</span>
                          <span className="bg-violet-50 px-3 py-1.5 rounded-lg text-violet-700">Frontal: {payment.details.frontal}</span>
                          <span className="bg-violet-50 px-3 py-1.5 rounded-lg text-violet-700">Closure: {payment.details.closure}</span>
                          <span className="bg-yellow-50 px-3 py-1.5 rounded-lg text-yellow-700">Sewing: {payment.details.sewing || 0}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="mt-0">
            <Card className="bg-white border border-gray-100 shadow-xl">
              <CardContent className="p-6">
                <div className="overflow-hidden rounded-2xl border border-gray-100">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frontal</th>
                        <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closure</th>
                        <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sewing</th>
                        <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workerHistory.production.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12">
                            <div className="text-gray-400">
                              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8" />
                              </div>
                              <p className="font-medium">No production history</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        workerHistory.production
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((record, index) => (
                            <tr key={index} className="hover:bg-violet-50">
                              <td className="py-4 px-6 font-medium text-gray-900">{formatDate(record.date)}</td>
                              <td className="text-right py-4 px-4 text-gray-600">{record.frontal}</td>
                              <td className="text-right py-4 px-4 text-gray-600">{record.closure}</td>
                              <td className="text-right py-4 px-4 text-gray-600">{record.sewing || '-'}</td>
                              <td className="text-right py-4 px-4">
                                <span className="inline-flex items-center justify-center bg-violet-600 text-white font-bold text-sm px-3 py-1 rounded-full">
                                  {record.total}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {selectedWorker === 'all' && (
        <Card className="bg-white border border-gray-100 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-violet-600" />
              </div>
              All Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {allPayments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-medium">No payment history</p>
                </div>
              ) : (
                allPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-100 rounded-2xl p-5 hover:border-violet-200 hover:bg-violet-50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center font-bold text-violet-700">
                          {getWorkerDisplayName(payment.workerId, payment.workerName).charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-900">{getWorkerDisplayName(payment.workerId, payment.workerName)}</div>
                          <div className="text-sm text-gray-500">
                            {formatDate(payment.weekStartDate)} - {formatDate(payment.weekEndDate)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl text-green-600">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-gray-500">Paid: {formatDate(payment.paidDate)}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="bg-gray-100 px-3 py-1.5 rounded-lg">Total: {payment.totalWigs}</span>
                      <span className="bg-violet-50 px-3 py-1.5 rounded-lg text-violet-700">F: {payment.details.frontal}</span>
                      <span className="bg-violet-50 px-3 py-1.5 rounded-lg text-violet-700">C: {payment.details.closure}</span>
                      <span className="bg-yellow-50 px-3 py-1.5 rounded-lg text-yellow-700">S: {payment.details.sewing || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
