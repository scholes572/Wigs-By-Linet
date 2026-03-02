import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
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
  Search
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface Worker {
  id: string;
  name: string;
  active: boolean;
  isOwner?: boolean;
}

interface WorkerManagementProps {
  setActiveTab?: (tab: string) => void;
}

export function WorkerManagement({ setActiveTab }: WorkerManagementProps) {
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
        
        // Get custom workers from localStorage
        const customWorkers = JSON.parse(localStorage.getItem('custom_workers') || '[]');
        const deletedWorkers = JSON.parse(localStorage.getItem('deleted_workers') || '[]');
        
        // Merge API data with localStorage data to preserve active status
        // and filter out deleted workers
        const mergedWorkers = data
          .filter((worker: Worker) => !deletedWorkers.includes(worker.id))
          .map((worker: Worker) => {
            const customWorker = customWorkers.find((w: Worker) => w.id === worker.id);
            if (customWorker) {
              return { ...worker, active: customWorker.active };
            }
            return worker;
          });
        
        setWorkers(mergedWorkers);
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
      
      const nameChanges = JSON.parse(localStorage.getItem('worker_name_changes') || '{}');
      nameChanges[selectedWorker.id] = editWorkerName.trim();
      localStorage.setItem('worker_name_changes', JSON.stringify(nameChanges));
      
      window.dispatchEvent(new Event('workerNameChanged'));
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
    window.dispatchEvent(new Event('workerNameChanged'));
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
    
    // Track deleted workers
    const deletedWorkers = JSON.parse(localStorage.getItem('deleted_workers') || '[]');
    if (!deletedWorkers.includes(selectedWorker.id)) {
      deletedWorkers.push(selectedWorker.id);
      localStorage.setItem('deleted_workers', JSON.stringify(deletedWorkers));
    }
    
    window.dispatchEvent(new Event('workerNameChanged'));
    setIsDeleteDialogOpen(false);
    setSelectedWorker(null);
    toast.success(`${selectedWorker.name} has been removed`);
  };

  const openEditDialog = (worker: Worker) => {
    setSelectedWorker(worker);
    setEditWorkerName(worker.name);
    setIsEditDialogOpen(true);
  };

  // Sort workers: owner first, then alphabetical
  const sortedWorkers = [...workers].sort((a, b) => {
    if (a.isOwner) return -1;
    if (b.isOwner) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredWorkers = sortedWorkers.filter(worker =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading workers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="text-gray-500 text-sm">{workers.length} members</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Worker
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Worker</DialogTitle>
              <DialogDescription>
                Enter the name of the new team member.
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
                  className="mt-2 h-11"
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? 'Adding...' : 'Add Worker'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search workers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {/* Worker Cards - Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkers.map((worker) => (
          <div 
            key={worker.id} 
            className={`relative rounded-2xl p-5 transition-all hover:shadow-lg ${
              worker.isOwner 
                ? 'bg-gradient-to-br from-yellow-50 to-amber-100 border border-yellow-200'
                : worker.active 
                  ? 'bg-white border border-gray-100 shadow-sm hover:border-blue-200'
                  : 'bg-gray-50 border border-gray-100 opacity-75'
            }`}
          >
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-md ${
                worker.isOwner 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' 
                  : worker.active
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {worker.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate flex items-center gap-1.5">
                  {worker.name}
                  {worker.isOwner && <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0" />}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  worker.isOwner
                    ? 'bg-yellow-200 text-yellow-800'
                    : worker.active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-200 text-gray-600'
                }`}>
                  {worker.isOwner ? 'Owner' : worker.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {/* Actions */}
            {!worker.isOwner ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 bg-white"
                  onClick={() => openEditDialog(worker)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 bg-white"
                  onClick={() => handleToggleActive(worker)}
                >
                  {worker.active ? (
                    <>
                      <UserX className="w-3.5 h-3.5 mr-1.5" />
                      Disable
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                      Enable
                    </>
                  )}
                </Button>
                <Dialog open={isDeleteDialogOpen && selectedWorker?.id === worker.id} onOpenChange={setIsDeleteDialogOpen}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 bg-white hover:bg-red-50 hover:border-red-200"
                    onClick={() => {
                      setSelectedWorker(worker);
                      setIsDeleteDialogOpen(true);
                    }}
                    disabled={worker.active}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Remove Worker</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to remove {selectedWorker?.name}? This cannot be undone.
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
            ) : (
              <div className="text-center py-2.5 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-lg">
                👑 Owner Account
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">No workers found</h3>
          <p className="text-gray-500 text-sm mb-4">
            {searchQuery ? 'Try a different search' : 'Add your first team member'}
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
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
            <DialogTitle>Edit Worker Name</DialogTitle>
            <DialogDescription>
              Update the name for {selectedWorker?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditWorker}>
            <div className="py-4">
              <Label htmlFor="editWorkerName">Worker Name</Label>
              <Input
                id="editWorkerName"
                value={editWorkerName}
                onChange={(e) => setEditWorkerName(e.target.value)}
                placeholder="Enter worker name"
                className="mt-2 h-11"
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
                className="bg-blue-600 hover:bg-blue-700"
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
