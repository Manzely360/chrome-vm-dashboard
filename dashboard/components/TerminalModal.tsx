'use client';

import React, { useState, useEffect } from 'react';
import { X, Terminal, Play, Download } from 'lucide-react';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  vmId: string;
  vmName: string;
  agentUrl: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
}

const TerminalModal: React.FC<TerminalModalProps> = ({
  isOpen,
  onClose,
  vmId,
  vmName,
  agentUrl
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen && agentUrl) {
      fetchLogs();
    }
  }, [isOpen, agentUrl]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Fetch container logs
      const response = await fetch(`/api/vms/${vmId}/logs`);
      if (response.ok) {
        const logData = await response.json();
        setLogs(logData.logs || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeScript = async () => {
    if (!script.trim() || !agentUrl) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const response = await fetch(`${agentUrl}/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: `terminal-${Date.now()}`,
          script: script,
          screenshot: false
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to execute script' });
    } finally {
      setIsExecuting(false);
    }
  };

  const downloadLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vmName}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Terminal - {vmName}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col p-4 space-y-4">
          {/* Script Execution */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Execute Script</h3>
            <div className="space-y-2">
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter JavaScript code to execute in the VM..."
                className="w-full h-20 p-2 border border-gray-300 rounded-md text-sm font-mono"
              />
              <div className="flex space-x-2">
                <button
                  onClick={executeScript}
                  disabled={!script.trim() || isExecuting}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  <span>{isExecuting ? 'Executing...' : 'Execute'}</span>
                </button>
                <button
                  onClick={() => setScript('')}
                  className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Execution Result</h3>
              <pre className="text-xs font-mono bg-white p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Logs */}
          <div className="flex-1 bg-gray-900 rounded-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-400">Container Logs</h3>
              <div className="flex space-x-2">
                <button
                  onClick={fetchLogs}
                  disabled={isLoading}
                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={downloadLogs}
                  className="flex items-center space-x-1 px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto text-xs font-mono text-green-400">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs available</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span className={`ml-2 ${
                      log.level === 'error' ? 'text-red-400' :
                      log.level === 'warn' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalModal;
