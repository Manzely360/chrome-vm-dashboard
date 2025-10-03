'use client';

import { useState } from 'react';
import { 
  ServerIcon, 
  TrashIcon, 
  RefreshCwIcon, 
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  WifiIcon,
  WifiOffIcon
} from 'lucide-react';
import { Server } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ServerCardProps {
  server: Server;
  onDelete: (serverId: string) => void;
  onTest: (serverId: string) => void;
}

export default function ServerCard({ server, onDelete, onTest }: ServerCardProps) {
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTest(server.id);
    } finally {
      setIsTesting(false);
    }
  };

  const getHealthIcon = () => {
    switch (server.health) {
      case 'healthy':
        return <CheckCircleIcon className="h-4 w-4 text-success-500" />;
      case 'unhealthy':
        return <XCircleIcon className="h-4 w-4 text-danger-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getHealthText = () => {
    switch (server.health) {
      case 'healthy':
        return 'Healthy';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return 'Unknown';
    }
  };

  const getHealthClass = () => {
    switch (server.health) {
      case 'healthy':
        return 'status-ready';
      case 'unhealthy':
        return 'status-error';
      default:
        return 'status-initializing';
    }
  };

  const getStatusIcon = () => {
    switch (server.status) {
      case 'active':
        return <WifiIcon className="h-4 w-4 text-success-500" />;
      case 'inactive':
        return <WifiOffIcon className="h-4 w-4 text-gray-400" />;
      case 'maintenance':
        return <AlertCircleIcon className="h-4 w-4 text-warning-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (server.status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = () => {
    switch (server.status) {
      case 'active':
        return 'status-ready';
      case 'inactive':
        return 'status-initializing';
      case 'maintenance':
        return 'status-warning';
      default:
        return 'status-initializing';
    }
  };

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ServerIcon className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{server.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          {getHealthIcon()}
          <span className={`text-xs ${getHealthClass()}`}>
            {getHealthText()}
          </span>
        </div>
      </div>

      {/* Server Info */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Host:</span>
          <span className="font-mono text-gray-900">{server.host}:{server.port}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Location:</span>
          <span className="text-gray-900">{server.location}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Max VMs:</span>
          <span className="text-gray-900">{server.max_vms}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Status:</span>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            <span className={`text-xs ${getStatusClass()}`}>
              {getStatusText()}
            </span>
          </div>
        </div>
        {server.response_time && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Response:</span>
            <span className="text-gray-900">{server.response_time}</span>
          </div>
        )}
        {server.last_check && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Last Check:</span>
            <span className="text-gray-900">
              {formatDistanceToNow(new Date(server.last_check), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {server.error && (
        <div className="mb-4 p-2 bg-danger-50 border border-danger-200 rounded text-sm text-danger-700">
          {server.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleTest}
          disabled={isTesting}
          className="flex-1 btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCwIcon className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
          {isTesting ? 'Testing...' : 'Test'}
        </button>
        
        <button
          onClick={() => onDelete(server.id)}
          className="btn btn-danger text-sm"
          title="Delete Server"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
