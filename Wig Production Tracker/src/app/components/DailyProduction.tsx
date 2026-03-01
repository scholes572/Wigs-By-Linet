import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Package, CheckCircle2 } from 'lucide-react';
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
}

export function DailyProduction() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [frontal, setFrontal] = useState('0');
  const [closure, setClosure] = useState('0');
  const [sewing, setSewing] = useState('0');
  const [todayRecords, setTodayRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  // Set date to today on mount and when page becomes visible
  useEffect(() => {
    const setToday = () => {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
    };
    
    setToday();
    
    // Also refresh when page becomes visible (e.g., user switches back to app)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setToday();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (date) {
      fetchWorkers();
      fetchTodayRecords();
    }
  }, [date]);

  const fetchWorkers = async () => {
    try {
      const response = await fetch(`${API_URL}/workers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWorkers(data.filter((w: Worker) => w.active));
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast.error('Failed to load workers');
    }
  };

  const fetchTodayRecords = async () => {
    try {
      const response = await fetch(`${API_URL}/production/${date}/${date}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTodayRecords(data);
      }
    } catch (error) {
      console.error('Error fetching today records:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const frontalNum = Number(frontal);
    const closureNum = Number(closure);
    const sewingNum = Number(sewing);
    
    if (frontalNum < 0 || closureNum < 0 || sewingNum < 0) {
      toast.error('Production values cannot be negative');
      return;
    }
    
    if (frontalNum === 0 && closureNum === 0 && sewingNum === 0) {
      toast.error('Please enter at least one wig production value');
      return;
    }
    
    // Validate date is not in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      toast.error('Cannot record production for future dates');
      return;
    }
    
    if (!selectedWorker) {
      toast.error('Please select a worker');
      return;
    }

    const worker = workers.find(w => w.id === selectedWorker);
    if (!worker) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/production`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          workerId: selectedWorker,
          workerName: worker.name,
          date,
          frontal: Number(frontal),
          closure: Number(closure),
          sewing: Number(sewing),
        }),
      });

      if (response.ok) {
        toast.success('Production recorded successfully!', {
          icon: <CheckCircle2 className="w-5 h-5 text-green-500" />
        });
        setFrontal('0');
        setClosure('0');
        setSewing('0');
        fetchTodayRecords();
      } else {
        toast.error('Failed to record production');
      }
    } catch (error) {
      console.error('Error adding production record:', error);
      toast.error('Failed to record production');
    } finally {
      setLoading(false);
    }
  };

  const totalProduction = todayRecords.reduce((sum, record) => sum + record.total, 0);

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Record Production 📝</h2>
            <p className="text-purple-100 mt-1">Track wigs made by each worker</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{totalProduction}</p>
            <p className="text-purple-200 text-sm">total wigs today</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-white border-0 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Worker & Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  Date
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-14 text-lg pl-12 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:ring-0 bg-gray-50"
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <Button 
                    type="button"
                    onClick={() => setDate(new Date().toISOString().split('T')[0])}
                    className="h-14 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl"
                  >
                    Today
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  Worker
                </Label>
                <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                  <SelectTrigger className="h-14 text-lg border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:ring-0 bg-gray-50">
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
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
            </div>

            {/* Wig Types */}
            <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-8 rounded-3xl border border-violet-100">
              <p className="text-lg font-bold text-gray-800 mb-6">Wig Types</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">Frontal</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={frontal}
                      onChange={(e) => setFrontal(e.target.value)}
                      placeholder="0"
                      className="h-16 text-2xl font-bold text-center border-2 border-violet-100 rounded-xl focus:border-purple-500 focus:ring-0 bg-white"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-400">Front lace wigs</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-600">Closure</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      value={closure}
                      onChange={(e) => setClosure(e.target.value)}
                      placeholder="0"
                      className="h-16 text-2xl font-bold text-center border-2 border-violet-100 rounded-xl focus:border-purple-500 focus:ring-0 bg-white"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-400">Closure wigs</p>
                </div>

                {selectedWorker && workers.find(w => w.id === selectedWorker)?.isOwner && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-600">Sewing</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={sewing}
                        onChange={(e) => setSewing(e.target.value)}
                        placeholder="0"
                        className="h-16 text-2xl font-bold text-center border-2 border-violet-100 rounded-xl focus:border-purple-500 focus:ring-0 bg-white"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-400">Only for owner</p>
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || !selectedWorker} 
              className="w-full h-16 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Add Production Record
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Today's Records */}
      <Card className="bg-white border-0 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              Production for {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Worker</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Frontal</th>
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closure</th>
                  {(selectedWorker && workers.find(w => w.id === selectedWorker)?.isOwner) || !selectedWorker ? (
                    <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sewing</th>
                  ) : null}
                  <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <div className="text-gray-400">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <p className="font-medium">No production records for this date</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todayRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-purple-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center font-bold text-white">
                            {getWorkerDisplayName(record.workerId, record.workerName).charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900">{getWorkerDisplayName(record.workerId, record.workerName)}</span>
                        </div>
                      </td>
                      <td className="text-center py-4 px-6 text-gray-600 font-medium">{record.frontal}</td>
                      <td className="text-center py-4 px-6 text-gray-600 font-medium">{record.closure}</td>
                      {(workers.find(w => w.id === record.workerId)?.isOwner) ? (
                        <td className="text-center py-4 px-6 text-gray-600 font-medium">{record.sewing}</td>
                      ) : (
                        <td className="text-center py-4 px-6 text-gray-300">-</td>
                      )}
                      <td className="text-center py-4 px-6">
                        <span className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm px-4 py-2 rounded-full">
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
    </div>
  );
}
