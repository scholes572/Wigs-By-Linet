import { useState, useEffect } from 'react';

const API_URL = `https://jdrcupieskahkmpcziwu.supabase.co/functions/v1/make-server-c1f79e64`;
const PUBLIC_ANON_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkcmN1cGllc2thaGttcGN6aXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODI2MDQsImV4cCI6MjA4Nzk1ODYwNH0.1BlSJSdmQ8_8_CQLDCx6TAuuSt7hXbwF6CXvY8qJYbk`;

export interface Worker {
  id: string;
  name: string;
  active: boolean;
  isOwner?: boolean;
}

// Apply name changes and active status from localStorage to worker list
function applyNameChanges(workers: Worker[]): Worker[] {
  const nameChanges = JSON.parse(localStorage.getItem('worker_name_changes') || '{}');
  const customWorkers = JSON.parse(localStorage.getItem('custom_workers') || '[]');
  const deletedWorkers = JSON.parse(localStorage.getItem('deleted_workers') || '[]');
  
  // Filter out deleted workers first
  const activeWorkers = workers.filter(worker => !deletedWorkers.includes(worker.id));
  
  return activeWorkers.map(worker => {
    const customWorker = customWorkers.find((w: Worker) => w.id === worker.id);
    return {
      ...worker,
      name: nameChanges[worker.id] || worker.name,
      active: customWorker ? customWorker.active : worker.active
    };
  });
}

export function useWorkers() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/workers`, {
        headers: { 'Authorization': `Bearer ${PUBLIC_ANON_KEY}` },
      });
      if (response.ok) {
        const data = await response.json();
        // Apply any name changes from localStorage
        const workersWithChanges = applyNameChanges(data);
        setWorkers(workersWithChanges);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get a worker's current name (with overrides applied)
  const getWorkerName = (workerId: string, defaultName?: string): string => {
    const nameChanges = JSON.parse(localStorage.getItem('worker_name_changes') || '{}');
    return nameChanges[workerId] || defaultName || '';
  };

  // Update a worker's name
  const updateWorkerName = (workerId: string, newName: string) => {
    const nameChanges = JSON.parse(localStorage.getItem('worker_name_changes') || '{}');
    nameChanges[workerId] = newName;
    localStorage.setItem('worker_name_changes', JSON.stringify(nameChanges));
    
    // Update local state
    setWorkers(prev => prev.map(w => 
      w.id === workerId ? { ...w, name: newName } : w
    ));
  };

  useEffect(() => {
    fetchWorkers();
    
    // Listen for worker name changes from other components
    const handleNameChange = () => {
      fetchWorkers();
    };
    
    window.addEventListener('workerNameChanged', handleNameChange);
    window.addEventListener('storage', handleNameChange);
    
    return () => {
      window.removeEventListener('workerNameChanged', handleNameChange);
      window.removeEventListener('storage', handleNameChange);
    };
  }, []);

  return { workers, loading, fetchWorkers, getWorkerName, updateWorkerName };
}

// Helper function to get display name for any worker ID
export function getWorkerDisplayName(workerId: string, defaultName: string): string {
  const nameChanges = JSON.parse(localStorage.getItem('worker_name_changes') || '{}');
  return nameChanges[workerId] || defaultName;
}
