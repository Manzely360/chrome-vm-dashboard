'use client';

import { useState } from 'react';
import { 
  PlayIcon, 
  TrashIcon, 
  ExternalLinkIcon, 
  MonitorIcon,
  CodeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  TerminalIcon
} from 'lucide-react';
import { VM } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface VMCardProps {
  vm: VM;
  onDelete: (vmId: string) => void;
  onRunScript: (vm: VM) => void;
  onOpenTerminal: (vm: VM) => void;
}

export default function VMCard({ vm, onDelete, onRunScript, onOpenTerminal }: VMCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete VM "${vm.name}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(vm.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusIcon = () => {
    switch (vm.status) {
      case 'ready':
        return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-danger-500" />;
      case 'running':
        return <AlertCircleIcon className="h-4 w-4 text-warning-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (vm.status) {
      case 'ready':
        return 'Ready';
      case 'initializing':
        return 'Initializing';
      case 'error':
        return 'Error';
      case 'running':
        return 'Running';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (vm.status) {
      case 'ready':
        return 'status-ready';
      case 'error':
        return 'status-error';
      case 'running':
        return 'status-running';
      default:
        return 'status-initializing';
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MonitorIcon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{vm.name}</h3>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          <span className={`text-xs ${getStatusClass()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* VM Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">ID:</span>
          <span className="font-mono text-gray-900">{vm.id}</span>
        </div>
        {vm.public_ip && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IP:</span>
            <span className="font-mono text-gray-900">{vm.public_ip}</span>
          </div>
        )}
        {vm.chrome_version && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Chrome:</span>
            <span className="font-mono text-gray-900">{vm.chrome_version}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Created:</span>
          <span className="text-gray-900">
            {formatDistanceToNow(new Date(vm.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={() => onRunScript(vm)}
          disabled={vm.status !== 'ready'}
          className="flex-1 btn btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CodeIcon className="h-4 w-4 mr-1" />
          Run Script
        </button>
        
        <button
          onClick={() => onOpenTerminal(vm)}
          disabled={vm.status !== 'ready'}
          className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Open Terminal"
        >
          <TerminalIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => {
            const novncUrl = vm.novnc_url.includes('vnc.html') 
              ? vm.novnc_url 
              : `${vm.novnc_url}/vnc.html`;
            window.open(novncUrl, '_blank');
          }}
          disabled={vm.status !== 'ready'}
          className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Open NoVNC"
        >
          <ExternalLinkIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn btn-danger text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete VM"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* NoVNC Preview */}
      {vm.status === 'ready' && (
        <div className="mt-4">
          <div 
            className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors" 
            style={{ height: '200px' }}
            onClick={() => {
              // Open NoVNC in new tab with auto-connect
              const novncUrl = vm.novnc_url.includes('vnc.html') 
                ? vm.novnc_url 
                : `${vm.novnc_url}/vnc.html`;
              
              const novncWindow = window.open(novncUrl, '_blank');
              
              if (novncWindow) {
                // Wait for NoVNC to load, then auto-connect and navigate to Google
                setTimeout(() => {
                  if (vm.agent_url) {
                    // Send navigation command to the VM
                    fetch(`${vm.agent_url}/browser/navigate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ url: 'https://accounts.google.com/signin' })
                    }).catch(console.error);
                  }
                }, 5000);
              }
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white">
                <MonitorIcon className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Click to control</p>
                <p className="text-xs opacity-80 mt-1">Live VNC Viewer</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
