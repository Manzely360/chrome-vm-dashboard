export interface VM {
  id: string;
  name: string;
  server_id?: string;
  status: 'ready' | 'initializing' | 'error' | 'running';
  novnc_url: string;
  agent_url: string;
  public_ip?: string;
  created_at: string;
  chrome_version?: string;
  node_version?: string;
  last_activity?: string;
  server?: Server;
}

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  novnc_port: number;
  max_vms: number;
  location: string;
  status: 'active' | 'inactive' | 'maintenance';
  health: 'healthy' | 'unhealthy' | 'unknown';
  created_at: string;
  last_check?: string;
  response_time?: string;
  error?: string;
}

export interface ScriptJob {
  id: string;
  vm_id: string;
  script: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  screenshot?: string;
  selected_text?: string;
  created_at: string;
  completed_at?: string;
}

export interface ScriptOptions {
  screenshot?: boolean;
  selector?: string;
  wait_time?: number;
}

export interface CreateVMRequest {
  name: string;
  instanceType: string;
  server_id: string;
}

export interface CreateServerRequest {
  name: string;
  host: string;
  port?: number;
  novnc_port?: number;
  max_vms?: number;
  location?: string;
}

export interface RunScriptRequest {
  script: string;
  screenshot?: boolean;
  selector?: string;
  wait_time?: number;
}

export interface RunScriptResponse {
  job_id: string;
  status: string;
  result?: any;
  screenshot?: string;
  selected_text?: string;
  timestamp: string;
  error?: string;
}