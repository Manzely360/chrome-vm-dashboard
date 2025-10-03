'use client';

import { useState } from 'react';
import { XIcon, ServerIcon } from 'lucide-react';
import { CreateVMRequest, Server } from '@/types';

interface CreateVMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (vmData: CreateVMRequest) => void;
  servers: Server[];
}

const instanceTypes = [
  { value: 't3.medium', label: 't3.medium - 2 vCPU, 4 GB RAM', recommended: true },
  { value: 't3.large', label: 't3.large - 2 vCPU, 8 GB RAM', recommended: false },
  { value: 't3.xlarge', label: 't3.xlarge - 4 vCPU, 16 GB RAM', recommended: false },
  { value: 't3.2xlarge', label: 't3.2xlarge - 8 vCPU, 32 GB RAM', recommended: false },
];

export default function CreateVMModal({ isOpen, onClose, onCreate, servers }: CreateVMModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    instanceType: 't3.medium',
    server_id: servers.length > 0 ? servers[0].id : '',
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(formData);
      setFormData({ name: '', instanceType: 't3.medium', server_id: '' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData({ 
        name: '', 
        instanceType: 't3.medium',
        server_id: servers.length > 0 ? servers[0].id : ''
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ServerIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Create New VM
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isCreating}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <XIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="vm-name" className="block text-sm font-medium text-gray-700 mb-1">
                    VM Name
                  </label>
                  <input
                    type="text"
                    id="vm-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Enter VM name"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label htmlFor="server-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Server
                  </label>
                  <select
                    id="server-select"
                    value={formData.server_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, server_id: e.target.value }))}
                    className="input"
                    required
                    disabled={isCreating}
                  >
                    <option value="">Select a server</option>
                    {servers.map((server) => (
                      <option key={server.id} value={server.id}>
                        {server.name} ({server.host}:{server.port}) - {server.health}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose which server to deploy the VM on
                  </p>
                </div>

                <div>
                  <label htmlFor="instance-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Instance Type
                  </label>
                  <select
                    id="instance-type"
                    value={formData.instanceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, instanceType: e.target.value }))}
                    className="input"
                    disabled={isCreating}
                  >
                    {instanceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} {type.recommended && '(Recommended)'}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Choose based on your workload requirements. Higher specs = better performance.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!formData.name.trim() || isCreating}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create VM'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
