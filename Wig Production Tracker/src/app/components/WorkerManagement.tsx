import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Users, Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface Worker {
  id: string;
  name: string;
  active: boolean;
  isOwner?: boolean;
}

export function WorkerManagement() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c1f79e64`;

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
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
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) {
      toast.error('Please enter a worker name');
      return;
    }

    setSubmitting(true);
    try {
      // Create a new worker with a generated ID
      const newWorker: Worker = {
        id: `worker_${Date.now()}`,
        name: newWorkerName.trim(),
        active: true,
      };

      // Add to existing workers (in a real app, this would be an API call)
      const updatedWorkers = [...workers, newWorker];
      
      // Store in localStorage as a workaround since we don't have a direct API
      localStorage.setItem('custom_workers', JSON.stringify(updatedWorkers.filter(w => !w.isOwner)));
      
      setWorkers(updatedWorkers);
      setNewWorkerName('');
      setIsAddDialogOpen(false);
      toast.success(`${newWorkerName} has been added successfully`);
    } catch (error) {
      console.error('Error adding worker:', error);
      toast.error('Failed to add worker');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (worker: Worker) => {
    if (worker.isOwner) {
      toast.error('Cannot deactivate the owner');
      return;
    }

    const updatedWorkers = workers.map(w => 
      w.id === worker.id ? { ...w, active: !w.active } : w
    );
    setWorkers(updatedWorkers);
    
    // Store in localStorage
    localStorage.setItem('custom_workers', JSON.stringify(updatedWorkers.filter(w => !w.isOwner && w.active !== undefined)));
    
    toast.success(`${worker.name} has been ${worker.active ? 'deactivated' : 'activated'}`);
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker || selectedWorker.isOwner) {
      toast.error('Cannot delete the owner');
      return;
    }

    const updatedWorkers = workers.filter(w => w.id !== selectedWorker.id);
    setWorkers(updatedWorkers);
    
    // Store in localStorage
    localStorage.setItem('custom_workers', JSON.stringify(updatedWorkers.filter(w => !w.isOwner)));
    
    setIsDeleteDialogOpen(false);
    setSelectedWorker(null);
    toast.success(`${selectedWorker.name} has been removed`);
  };

  const activeWorkers = workers.filter(w => w.active);
  const inactiveWorkers = workers.filter(w => !w.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Worker Management</h2>
          <p className="text-gray-600">Manage your team members and their account status</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>
                Enter the name of the new worker to add to your team.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddWorker}>
              <div className="py-4">
                <Label htmlFor="workerName">Worker Name</Label>
                <Input
                  id="workerName"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Enter worker name"
                  className="mt-2"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Worker'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Total Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{workers.length}</div>
            <p className="text-xs opacity-80 mt-1">team members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Active Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeWorkers.length}</div>
            <p className="text-xs opacity-80 mt-1">currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium opacity-90">Inactive Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inactiveWorkers.length}</div>
            <p className="text-xs opacity-80 mt-1">deactivated</p>
          </CardContent>
        </Card>
      </div>

      {/* Worker List */}
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            All Workers
          </CardTitle>
          <CardDescription>View and manage all workers in your team</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {workers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No workers found</p>
              <Button 
                variant="link" 
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-2 text-purple-600"
              >
                Add your first worker
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    worker.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                      worker.isOwner 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                        : worker.active
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {worker.name.charAt(0).toUpperCase()}
                      {worker.isOwner && ' 👑'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{worker.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={worker.active ? 'default' : 'secondary'}>
                          {worker.active ? (
                            <><UserCheck className="w-3 h-3 mr-1" /> Active</>
                          ) : (
                            <><UserX className="w-3 h-3 mr-1" /> Inactive</>
                          )}
                        </Badge>
                        {worker.isOwner && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {!worker.isOwner && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(worker)}
                        title={worker.active ? 'Deactivate worker' : 'Activate worker'}
                      >
                        {worker.active ? (
                          <UserX className="w-4 h-4 text-orange-500" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      
                      <Dialog open={isDeleteDialogOpen && selectedWorker?.id === worker.id} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedWorker(worker)}
                            title="Remove worker"
                            disabled={!worker.active}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remove Worker</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to remove {selectedWorker?.name}? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteWorker}>
                              Remove
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
