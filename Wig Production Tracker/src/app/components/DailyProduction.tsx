import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
        // Get deleted workers from localStorage
        const deletedWorkers = JSON.parse(localStorage.getItem('deleted_workers') || '[]');
        // Filter out deleted workers and include all active ones plus owner
        const filteredWorkers = data.filter((worker: Worker) => !deletedWorkers.includes(worker.id));
        setWorkers(filteredWorkers);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-blue-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Daily Production</h2>
            <p className="text-blue-100 mt-1">Record wig production</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <p className="text-3xl font-bold">{totalProduction}</p>
            <p className="text-blue-200 text-sm">Total Wigs</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Worker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Worker</Label>
              <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      <div className="flex items-center gap-2">
                        <span>{getWorkerDisplayName(worker.id, worker.name)}</span>
                        {worker.isOwner && <span>👑</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Wig Types Row - Stack on mobile */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Wig Type & Quantity</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Frontal */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3 text-center">Frontal</p>
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setFrontal(Math.max(0, (parseInt(frontal) || 0) - 1).toString())}
                      className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min="0"
                      value={frontal}
                      onChange={(e) => setFrontal(e.target.value)}
                      className="h-12 w-20 text-center text-lg font-semibold"
                    />
                    <button 
                      type="button"
                      onClick={() => setFrontal(((parseInt(frontal) || 0) + 1).toString())}
                      className="w-12 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Closure */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-3 text-center">Closure</p>
                  <div className="flex items-center justify-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setClosure(Math.max(0, (parseInt(closure) || 0) - 1).toString())}
                      className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      min="0"
                      value={closure}
                      onChange={(e) => setClosure(e.target.value)}
                      className="h-12 w-20 text-center text-lg font-semibold"
                    />
                    <button 
                      type="button"
                      onClick={() => setClosure(((parseInt(closure) || 0) + 1).toString())}
                      className="w-12 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sewing */}
            {selectedWorker && workers.find(w => w.id === selectedWorker)?.isOwner && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">Sewing (Owner Only)</p>
                <div className="flex items-center justify-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setSewing(Math.max(0, (parseInt(sewing) || 0) - 1).toString())}
                    className="w-12 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xl"
                  >
                    −
                  </button>
                  <Input
                    type="number"
                    min="0"
                    value={sewing}
                    onChange={(e) => setSewing(e.target.value)}
                    className="h-12 w-20 text-center text-lg font-semibold"
                  />
                  <button 
                    type="button"
                    onClick={() => setSewing(((parseInt(sewing) || 0) + 1).toString())}
                    className="w-12 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <Button 
                type="submit" 
                disabled={loading || !selectedWorker} 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Saving...' : 'Save Production'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                disabled={loading || !selectedWorker}
                onClick={() => {
                  if (selectedWorker && (parseInt(frontal) > 0 || parseInt(closure) > 0 || parseInt(sewing) > 0)) {
                    handleSubmit(new Event('submit') as any);
                    setFrontal('0');
                    setClosure('0');
                    setSewing('0');
                  }
                }}
                className="w-full h-11"
              >
                Save & Add Another
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Records */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">
            Production - {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {todayRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2" />
              <p>No records for this date</p>
            </div>
          ) : (
            <div className="divide-y">
              {todayRecords.map((record, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                      {getWorkerDisplayName(record.workerId, record.workerName).charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{getWorkerDisplayName(record.workerId, record.workerName)}</p>
                      <p className="text-xs text-gray-500">F: {record.frontal} | C: {record.closure} | S: {record.sewing || '-'}</p>
                    </div>
                  </div>
                  <span className="bg-blue-600 text-white font-bold px-4 py-1.5 rounded-full">
                    {record.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
