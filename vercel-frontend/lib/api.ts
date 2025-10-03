const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chrome-vm-backend-production.up.railway.app';

export const api = {
  // VMs
  getVMs: () => fetch(`${API_BASE_URL}/api/vms`).then(res => res.json()),
  createVM: (data: any) => fetch(`${API_BASE_URL}/api/vms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteVM: (id: string) => fetch(`${API_BASE_URL}/api/vms/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),
  runScript: (id: string, data: any) => fetch(`${API_BASE_URL}/api/vms/${id}/run-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
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
