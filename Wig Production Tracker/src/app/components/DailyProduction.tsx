import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { Package } from 'lucide-react';

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

  useEffect(() => {
    fetchWorkers();
    fetchTodayRecords();
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
        setWorkers(data);
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
        toast.success('Production record added successfully');
        setFrontal('0');
        setClosure('0');
        setSewing('0');
        fetchTodayRecords();
      } else {
        toast.error('Failed to add production record');
      }
    } catch (error) {
      console.error('Error adding production record:', error);
      toast.error('Failed to add production record');
    } finally {
      setLoading(false);
    }
  };

  const totalProduction = todayRecords.reduce((sum, record) => sum + record.total, 0);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="text-lg md:text-xl">Record Daily Production</CardTitle>
          <CardDescription className="text-sm">Track wigs made by each worker today</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-gray-700">Date</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="text-sm pl-10 h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="worker" className="text-sm font-semibold text-gray-700">Worker</Label>
                <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                  <SelectTrigger className="text-sm h-11 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                    <SelectValue placeholder="Select worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id} className="text-sm">
                        {worker.name} {worker.isOwner ? '👑' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 rounded-xl">
              <p className="text-sm font-semibold text-gray-700 mb-4">Wig Types</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frontal" className="text-sm text-gray-600">Frontal</Label>
                  <Input
                    id="frontal"
                    type="number"
                    min="0"
                    value={frontal}
                    onChange={(e) => setFrontal(e.target.value)}
                    placeholder="0"
                    className="text-sm h-11 text-center text-lg font-semibold border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closure" className="text-sm text-gray-600">Closure</Label>
                  <Input
                    id="closure"
                    type="number"
                    min="0"
                    value={closure}
                    onChange={(e) => setClosure(e.target.value)}
                    placeholder="0"
                    className="text-sm h-11 text-center text-lg font-semibold border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sewing" className="text-sm text-gray-600">Sewing</Label>
                  <Input
                    id="sewing"
                    type="number"
                    min="0"
                    value={sewing}
                    onChange={(e) => setSewing(e.target.value)}
                    placeholder="0"
                    className="text-sm h-11 text-center text-lg font-semibold border-gray-300"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full md:w-auto h-11 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm font-semibold shadow-lg"
            >
              {loading ? 'Saving...' : 'Add Production Record'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg md:text-xl">Production for {date}</CardTitle>
              <CardDescription className="text-sm mt-1">
                <span className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full mt-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-600">{totalProduction}</span>
                  <span className="text-gray-600">total wigs</span>
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Worker</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Frontal</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Closure</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Sewing</th>
                  <th className="text-center py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No production records for this date</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  todayRecords.map((record, index) => (
                    <tr key={index} className="border-b hover:bg-purple-50 transition-colors">
                      <td className="py-3 px-2 md:px-4 text-xs md:text-sm font-medium">{record.workerName}</td>
                      <td className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{record.frontal}</td>
                      <td className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{record.closure}</td>
                      <td className="text-center py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600">{record.sewing}</td>
                      <td className="text-center py-3 px-2 md:px-4">
                        <span className="inline-flex items-center justify-center bg-purple-100 text-purple-700 font-bold text-xs md:text-sm px-3 py-1 rounded-full">
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