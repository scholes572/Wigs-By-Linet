import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  UserCheck, 
  UserX,
  Crown,
  Search,
  MoreVertical
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [editWorkerName, setEditWorkerName] = useState('');
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
      const newWorker: Worker = {
        id: `worker_${Date.now()}`,
        name: newWorkerName.trim(),
        active: true,
      };

      const updatedWorkers = [...workers, newWorker];
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

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkerName.trim() || !selectedWorker) {
      toast.error('Please enter a worker name');
      return;
    }

    setSubmitting(true);
    try {
      const updatedWorkers = workers.map(w => 
        w.id === selectedWorker.id ? { ...w, name: editWorkerName.trim() } : w
      );
      
      // Save to localStorage for persistence
      const nameChanges = JSON.parse(localStorage.getItem('worker_name_changes') || '{}');
      nameChanges[selectedWorker.id] = editWorkerName.trim();
      localStorage.setItem('worker_name_changes', JSON.stringify(nameChanges));
      
      // Notify other components to refresh
      window.dispatchEvent(new Event('workerNameChanged'));
      
      // Notify other components
      window.dispatchEvent(new Event('workerNameChanged'));
      
      setWorkers(updatedWorkers);
      setEditWorkerName('');
      setIsEditDialogOpen(false);
      setSelectedWorker(null);
      toast.success(`Worker name updated successfully`);
    } catch (error) {
      console.error('Error updating worker:', error);
      toast.error('Failed to update worker');
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
    localStorage.setItem('custom_workers', JSON.stringify(updatedWorkers.filter(w => !w.isOwner)));
    toast.success(`${worker.name} has been ${worker.active ? 'deactivated' : 'activated'}`);
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker || selectedWorker.isOwner) {
      toast.error('Cannot delete the owner');
      return;
    }

    const updatedWorkers = workers.filter(w => w.id !== selectedWorker.id);
    setWorkers(updatedWorkers);
    localStorage.setItem('custom_workers', JSON.stringify(updatedWorkers.filter(w => !w.isOwner)));
    setIsDeleteDialogOpen(false);
    setSelectedWorker(null);
    toast.success(`${selectedWorker.name} has been removed`);
  };

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setEditWorkerName(worker.name);
    setIsEditDialogOpen(true);
  };

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeWorkers = filteredWorkers.filter(w => w.active);
  const inactiveWorkers = filteredWorkers.filter(w => !w.active);

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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Team Members
          </h2>
          <p className="text-gray-600 mt-1">Manage your wig production team</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add New Worker</DialogTitle>
              <DialogDescription>
                Enter the name of the new team member to add.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddWorker}>
              <div className="py-6">
                <Label htmlFor="workerName" className="text-sm font-medium text-gray-700">
                  Worker Name
                </Label>
                <Input
                  id="workerName"
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Enter worker name"
                  className="mt-2 h-12 text-lg"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !newWorkerName.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {submitting ? 'Adding...' : 'Add Worker'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Workers</p>
                <p className="text-4xl font-bold mt-1">{workers.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active</p>
                <p className="text-4xl font-bold mt-1">{activeWorkers.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <UserCheck className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-400 to-orange-500 text-white border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Inactive</p>
                <p className="text-4xl font-bold mt-1">{inactiveWorkers.length}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <UserX className="w-7 h-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search workers by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-lg bg-white border-gray-200 shadow-sm"
        />
      </div>

      {/* Worker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <Card 
            key={worker.id} 
            className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${
              worker.active 
                ? 'border-0 bg-white' 
                : 'border-0 bg-gray-100 opacity-70'
            }`}
          >
            <CardContent className="p-0">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg ${
                      worker.isOwner 
                        ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                        : worker.active
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {worker.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        {worker.name}
                        {worker.isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
                      </h3>
                      <Badge 
                        variant={worker.active ? 'default' : 'secondary'}
                        className={`mt-1 ${worker.active ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-200 text-gray-600'}`}
                      >
                        {worker.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-5 pt-4 border-t border-gray-100">
                  {!worker.isOwner ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 hover:bg-purple-50 hover:border-purple-200"
                        onClick={() => openEditDialog(worker)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${worker.active ? 'hover:bg-orange-50 hover:border-orange-200' : 'hover:bg-green-50 hover:border-green-200'}`}
                        onClick={() => handleToggleActive(worker)}
                      >
                        {worker.active ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Dialog open={isDeleteDialogOpen && selectedWorker?.id === worker.id} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 hover:border-red-200"
                            onClick={() => setSelectedWorker(worker)}
                            disabled={worker.active}
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
                    </>
                  ) : (
                    <div className="flex-1 text-center py-2">
                      <p className="text-sm text-gray-500">Owner Account</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workers found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search query' : 'Add your first team member to get started'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Worker
            </Button>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Worker Name</DialogTitle>
            <DialogDescription>
              Update the name for {selectedWorker?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditWorker}>
            <div className="py-6">
              <Label htmlFor="editWorkerName" className="text-sm font-medium text-gray-700">
                Worker Name
              </Label>
              <Input
                id="editWorkerName"
                value={editWorkerName}
                onChange={(e) => setEditWorkerName(e.target.value)}
                placeholder="Enter worker name"
                className="mt-2 h-12 text-lg"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !editWorkerName.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
