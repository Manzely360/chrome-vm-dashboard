const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pacific-blessing-production.up.railway.app';

export const api = {
  // VMs - Basic Operations
  getVMs: () => fetch(`${API_BASE_URL}/api/vms`).then(res => res.json()),
  createVM: (data: any) => fetch(`${API_BASE_URL}/api/vms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteVM: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
  getVM: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}`).then(res => res.json()),

  // VM Management
  startVM: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/start`, {
    method: 'POST'
  }).then(res => res.json()),
  stopVM: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/stop`, {
    method: 'POST'
  }).then(res => res.json()),
  restartVM: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/restart`, {
    method: 'POST'
  }).then(res => res.json()),
  getVMStatus: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/status`).then(res => res.json()),

  // Script Execution
  executeScript: (id: string, data: { scriptName: string; scriptContent: string }) => 
    fetch(`${API_BASE_URL}/api/vms/${id}/scripts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),
  getScripts: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/scripts`).then(res => res.json()),

  // Metrics and Monitoring
  getMetrics: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/metrics`).then(res => res.json()),
  recordMetrics: (id: string, data: { metricType: string; value: number; unit: string }) =>
    fetch(`${API_BASE_URL}/api/vms/${id}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),

  // Events and Logs
  getEvents: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/events`).then(res => res.json()),
  getVMLogs: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}/logs`).then(res => res.json()),

  // Servers
  getServers: () => fetch(`${API_BASE_URL}/api/servers`).then(res => res.json()),
  createServer: (data: any) => fetch(`${API_BASE_URL}/api/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteServer: (id: string) => fetch(`${API_BASE_URL}/api/servers/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Health
  getHealth: () => fetch(`${API_BASE_URL}/health`).then(res => res.json())
};

export default api;
