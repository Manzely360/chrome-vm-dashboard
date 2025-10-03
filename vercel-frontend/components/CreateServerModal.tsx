'use client';

import { useState } from 'react';
import { XIcon, ServerIcon, WifiIcon } from 'lucide-react';
import { CreateServerRequest } from '@/types';

interface CreateServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (serverData: CreateServerRequest) => void;
}

export default function CreateServerModal({ isOpen, onClose, onCreate }: CreateServerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 3000,
    novnc_port: 6080,
    max_vms: 10,
    location: 'Unknown'
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.host.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(formData);
      setFormData({
        name: '',
        host: '',
        port: 3000,
        novnc_port: 6080,
        max_vms: 10,
        location: 'Unknown'
      });
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFormData({
        name: '',
        host: '',
        port: 3000,
        novnc_port: 6080,
        max_vms: 10,
        location: 'Unknown'
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
                    Add New Server
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
                  <label htmlFor="server-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Server Name
                  </label>
                  <input
                    type="text"
                    id="server-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="e.g., US-East-1, Europe-West-1"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label htmlFor="server-host" className="block text-sm font-medium text-gray-700 mb-1">
                    Host IP/Address
                  </label>
                  <input
                    type="text"
                    id="server-host"
                    value={formData.host}
                    onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                    className="input"
                    placeholder="192.168.1.100 or server.example.com"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="server-port" className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Port
                    </label>
                    <input
                      type="number"
                      id="server-port"
                      value={formData.port}
                      onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) || 3000 }))}
                      className="input"
                      min="1"
                      max="65535"
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <label htmlFor="novnc-port" className="block text-sm font-medium text-gray-700 mb-1">
                      NoVNC Port
                    </label>
                    <input
                      type="number"
                      id="novnc-port"
                      value={formData.novnc_port}
                      onChange={(e) => setFormData(prev => ({ ...prev, novnc_port: parseInt(e.target.value) || 6080 }))}
                      className="input"
                      min="1"
                      max="65535"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="max-vms" className="block text-sm font-medium text-gray-700 mb-1">
                      Max VMs
                    </label>
                    <input
                      type="number"
                      id="max-vms"
                      value={formData.max_vms}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_vms: parseInt(e.target.value) || 10 }))}
                      className="input"
                      min="1"
                      max="100"
                      disabled={isCreating}
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="input"
                      placeholder="e.g., New York, London"
                      disabled={isCreating}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={!formData.name.trim() || !formData.host.trim() || isCreating}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <WifiIcon className="h-4 w-4 mr-2" />
                    Add Server
                  </>
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
