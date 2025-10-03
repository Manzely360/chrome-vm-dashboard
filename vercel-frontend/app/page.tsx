'use client';

import { useState, useEffect } from 'react';
import { PlusIcon, PlayIcon, Square, TrashIcon, RefreshCwIcon, ServerIcon, MonitorIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import VMCard from '@/components/VMCard';
import ServerCard from '@/components/ServerCard';
import CreateVMModal from '@/components/CreateVMModal';
import CreateServerModal from '@/components/CreateServerModal';
import ScriptModal from '@/components/ScriptModal';
import { VM, Server, ScriptJob, CreateServerRequest } from '@/types';
import api from '@/lib/api';

export default function Dashboard() {
  const [vms, setVms] = useState<VM[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedVM, setSelectedVM] = useState<VM | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'vms' | 'servers'>('vms');

  // Fetch VMs and servers on component mount
  useEffect(() => {
    fetchVMs();
    fetchServers();
  }, []);

  const fetchVMs = async () => {
    try {
      setLoading(true);
      const data = await api.getVMs();
      setVms(data);
    } catch (error) {
      console.error('Error fetching VMs:', error);
      toast.error('Failed to fetch VMs');
    } finally {
      setLoading(false);
    }
  };

  const fetchServers = async () => {
    try {
      const data = await api.getServers();
      setServers(data);
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast.error('Failed to fetch servers');
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchVMs(), fetchServers()]);
    setRefreshing(false);
  };

  const createVM = async (vmData: { name: string; instanceType: string; server_id: string }) => {
    try {
      const newVM = await api.createVM(vmData);
      setVms(prev => [...prev, newVM]);
      setShowCreateModal(false);
      toast.success('VM creation started');
    } catch (error) {
      console.error('Error creating VM:', error);
      toast.error('Failed to create VM');
    }
  };

  const createServer = async (serverData: CreateServerRequest) => {
    try {
      const newServer = await api.createServer(serverData);
      setServers(prev => [...prev, newServer]);
      toast.success('Server added successfully');
    } catch (error) {
      console.error('Error creating server:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create server');
    }
  };

  const deleteVM = async (vmId: string) => {
    try {
      await api.deleteVM(vmId);
      setVms(prev => prev.filter(vm => vm.id !== vmId));
      toast.success('VM deleted');
    } catch (error) {
      console.error('Error deleting VM:', error);
      toast.error('Failed to delete VM');
    }
  };

  const deleteServer = async (serverId: string) => {
    try {
      await api.deleteServer(serverId);
      setServers(prev => prev.filter(server => server.id !== serverId));
      toast.success('Server deleted');
    } catch (error) {
      console.error('Error deleting server:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete server');
    }
  };

  const testServer = async (serverId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/test`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Server test failed');
      }

      const result = await response.json();
      if (result.status === 'success') {
        toast.success(`Server test successful (${result.response_time})`);
        fetchServers(); // Refresh server list
      } else {
        toast.error('Server test failed');
      }
    } catch (error) {
      console.error('Error testing server:', error);
      toast.error('Failed to test server');
    }
  };

  const runScript = async (vmId: string, script: string, options: any) => {
    try {
      const result = await api.runScript(vmId, { script, ...options });
      toast.success('Script executed successfully');
      return result;
    } catch (error) {
      console.error('Error running script:', error);
      toast.error('Failed to run script');
      throw error;
    }
  };

  const handleScriptModal = (vm: VM) => {
    setSelectedVM(vm);
    setShowScriptModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chrome VM Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your browser farm and run automated scripts
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshAll}
                disabled={refreshing}
                className="btn btn-secondary"
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                disabled={servers.length === 0}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add VM
              </button>
              <button
                onClick={() => setShowServerModal(true)}
                className="btn btn-secondary"
              >
                <ServerIcon className="h-4 w-4 mr-2" />
                Add Server
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('vms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'vms'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MonitorIcon className="h-4 w-4 inline mr-2" />
              VMs ({vms.length})
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'servers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ServerIcon className="h-4 w-4 inline mr-2" />
              Servers ({servers.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'vms' ? (
          // VMs Tab
          vms.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <MonitorIcon className="h-24 w-24" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No VMs found</h3>
              <p className="mt-2 text-gray-500">
                {servers.length === 0 
                  ? 'Add a server first, then create your first Chrome VM.'
                  : 'Get started by creating your first Chrome VM.'
                }
              </p>
              <div className="mt-4 space-x-3">
                {servers.length === 0 && (
                  <button
                    onClick={() => setShowServerModal(true)}
                    className="btn btn-secondary"
                  >
                    <ServerIcon className="h-4 w-4 mr-2" />
                    Add Server First
                  </button>
                )}
                {servers.length > 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create VM
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vms.map((vm) => (
                <VMCard
                  key={vm.id}
                  vm={vm}
                  onDelete={deleteVM}
                  onRunScript={handleScriptModal}
                />
              ))}
            </div>
          )
        ) : (
          // Servers Tab
          servers.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                <ServerIcon className="h-24 w-24" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No servers found</h3>
              <p className="mt-2 text-gray-500">Add your first server to start managing VMs.</p>
              <button
                onClick={() => setShowServerModal(true)}
                className="mt-4 btn btn-primary"
              >
                <ServerIcon className="h-4 w-4 mr-2" />
                Add Server
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  onDelete={deleteServer}
                  onTest={testServer}
                />
              ))}
            </div>
          )
        )}
      </main>

      {/* Modals */}
      <CreateVMModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createVM}
        servers={servers}
      />

      <CreateServerModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        onCreate={createServer}
      />

      <ScriptModal
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
        vm={selectedVM}
        onRunScript={runScript}
      />
    </div>
  );
}