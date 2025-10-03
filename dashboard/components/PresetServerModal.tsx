'use client';

import { useState } from 'react';
import { XIcon, ServerIcon, CloudIcon, ZapIcon } from 'lucide-react';
import { CreateServerRequest } from '@/types';

interface PresetServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (serverData: CreateServerRequest) => void;
}

interface PresetServer {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  host: string;
  port: number;
  novnc_port: number;
  max_vms: number;
  location: string;
  type: 'railway' | 'cloudflare';
  features: string[];
}

const presetServers: PresetServer[] = [
  {
    id: 'railway',
    name: 'Railway Cloud',
    description: 'Deploy Chrome VMs on Railway with Puppeteer integration',
    icon: <ZapIcon className="h-6 w-6 text-blue-600" />,
    host: 'chrome-vm-hosting-production.up.railway.app',
    port: 3000,
    novnc_port: 6080,
    max_vms: 5,
    location: 'Global (Railway)',
    type: 'railway',
    features: [
      'Puppeteer integration',
      'Headless Chrome',
      'Auto-scaling',
      'Global CDN',
      'HTTPS support'
    ]
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers',
    description: 'Deploy Chrome VMs on Cloudflare edge network',
    icon: <CloudIcon className="h-6 w-6 text-orange-600" />,
    host: 'chrome-vm.workers.dev',
    port: 443,
    novnc_port: 443,
    max_vms: 10,
    location: 'Global (Cloudflare)',
    type: 'cloudflare',
    features: [
      'Edge computing',
      'Low latency',
      'DDoS protection',
      'Global distribution',
      'Serverless scaling'
    ]
  }
];

export default function PresetServerModal({ isOpen, onClose, onCreate }: PresetServerModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetServer | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handlePresetSelect = (preset: PresetServer) => {
    setSelectedPreset(preset);
  };

  const handleCreate = async () => {
    if (!selectedPreset) return;

    setIsCreating(true);
    try {
      const serverData: CreateServerRequest = {
        name: selectedPreset.name,
        host: selectedPreset.host,
        port: selectedPreset.port,
        novnc_port: selectedPreset.novnc_port,
        max_vms: selectedPreset.max_vms,
        location: selectedPreset.location
      };

      await onCreate(serverData);
      setSelectedPreset(null);
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setSelectedPreset(null);
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
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <ServerIcon className="h-6 w-6 text-primary-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Choose a Preset Server
                </h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isCreating}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Close"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Preset Server Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presetServers.map((preset) => (
                <div
                  key={preset.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPreset?.id === preset.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      {preset.icon}
                      <div className="ml-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {preset.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {preset.description}
                        </p>
                      </div>
                    </div>
                    {selectedPreset?.id === preset.id && (
                      <div className="flex-shrink-0">
                        <div 
                          className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center"
                          title="Selected"
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Host:</strong> {preset.host}</div>
                      <div><strong>Port:</strong> {preset.port}</div>
                      <div><strong>Max VMs:</strong> {preset.max_vms}</div>
                      <div><strong>Location:</strong> {preset.location}</div>
                    </div>

                    <div className="mt-3">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Features:</h5>
                      <div className="flex flex-wrap gap-1">
                        {preset.features.map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Server Option */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">
                  Don't see what you need? Add a custom server instead.
                </p>
                <button
                  onClick={onClose}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Add Custom Server
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleCreate}
              disabled={!selectedPreset || isCreating}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <ServerIcon className="h-4 w-4 mr-2" />
                  Add {selectedPreset?.name || 'Server'}
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
        </div>
      </div>
    </div>
  );
}
