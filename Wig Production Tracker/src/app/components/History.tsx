import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { History as HistoryIcon, DollarSign, Package, Download } from 'lucide-react';
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
        setWorkers(data);
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Label htmlFor="worker-filter" className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Worker</Label>
          <Select value={selectedWorker} onValueChange={setSelectedWorker}>
            <SelectTrigger id="worker-filter" className="text-sm h-11 border-gray-300">
              <SelectValue placeholder="Select worker" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">📊 All Workers</SelectItem>
              {workers.map((worker) => (
                <SelectItem key={worker.id} value={worker.id} className="text-sm">
                  {worker.name} {worker.isOwner ? '👑' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-white opacity-80">Total Payments Made</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs opacity-80 mt-1">{displayPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      {selectedWorker !== 'all' && (
        <Tabs defaultValue="payments">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments" className="text-xs md:text-sm">Payment History</TabsTrigger>
            <TabsTrigger value="production" className="text-xs md:text-sm">Production History</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                  Payment History
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  All payments made to {workers.find(w => w.id === selectedWorker)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workerHistory.payments.length === 0 ? (
                    <p className="text-center py-8 text-gray-500 text-sm">No payment history</p>
                  ) : (
                    workerHistory.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2">
                          <div>
                            <div className="font-semibold text-base md:text-lg">
                              {formatCurrency(payment.amount)}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500">
                              Week: {formatDate(payment.weekStartDate)} - {formatDate(payment.weekEndDate)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Paid on {formatDate(payment.paidDate)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mt-2">
                          <span>Total Wigs: {payment.totalWigs}</span>
                          <span className="hidden md:inline">•</span>
                          <span>Frontal: {payment.details.frontal}</span>
                          <span>Closure: {payment.details.closure}</span>
                          <span>Sewing: {payment.details.sewing}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Package className="w-4 h-4 md:w-5 md:h-5" />
                  Production History
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  All wigs made by {workers.find(w => w.id === selectedWorker)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 md:mx-0">
                  <table className="w-full min-w-[500px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 md:px-4 text-xs md:text-sm">Date</th>
                        <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">Frontal</th>
                        <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">Closure</th>
                        <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">Sewing</th>
                        <th className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workerHistory.production.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                            No production history
                          </td>
                        </tr>
                      ) : (
                        workerHistory.production
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((record, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="py-2 px-2 md:px-4 text-xs md:text-sm">{formatDate(record.date)}</td>
                              <td className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">{record.frontal}</td>
                              <td className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">{record.closure}</td>
                              <td className="text-right py-2 px-2 md:px-4 text-xs md:text-sm">{record.sewing}</td>
                              <td className="text-right py-2 px-2 md:px-4 font-semibold text-xs md:text-sm">{record.total}</td>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <HistoryIcon className="w-4 h-4 md:w-5 md:h-5" />
                All Payment History
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">Complete payment records for all workers</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={allPayments.length === 0}
              className="ml-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allPayments.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">No payment history</p>
              ) : (
                allPayments.map((payment, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 md:p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-base md:text-lg">
                          {payment.workerName}
                        </div>
                        <div className="text-xs md:text-sm text-gray-500">
                          Week: {formatDate(payment.weekStartDate)} - {formatDate(payment.weekEndDate)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-base md:text-lg">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Paid: {formatDate(payment.paidDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600 mt-2">
                      <span>Total Wigs: {payment.totalWigs}</span>
                      <span className="hidden md:inline">•</span>
                      <span>Frontal: {payment.details.frontal}</span>
                      <span>Closure: {payment.details.closure}</span>
                      <span>Sewing: {payment.details.sewing}</span>
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