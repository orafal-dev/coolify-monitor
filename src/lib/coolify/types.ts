export type CoolifyApplication = {
  uuid: string;
  name: string;
  status: string;
  fqdn?: string | null;
  git_repository?: string | null;
  git_branch?: string | null;
  description?: string | null;
  project_uuid?: string | null;
  environment_name?: string | null;
  environment_uuid?: string | null;
  environment_id?: number | null;
};

export type CoolifyDatabase = {
  uuid: string;
  name: string;
  type: string;
  status: string;
  is_public?: boolean;
  environment_id?: number;
  project_uuid?: string | null;
  environment_name?: string | null;
  environment_uuid?: string | null;
};

export type CoolifyService = {
  uuid: string;
  name: string;
  status: string;
  description?: string | null;
  fqdn?: string | null;
  project_uuid?: string | null;
  environment_name?: string | null;
  environment_uuid?: string | null;
  environment_id?: number | null;
};

export type CoolifyServer = {
  uuid: string;
  name: string;
  ip: string;
  is_reachable?: boolean;
  description?: string | null;
};

export type CoolifyProject = {
  uuid: string;
  name: string;
  description?: string | null;
};

export type CoolifyDeployment = {
  uuid: string;
  status: string;
  application_name?: string | null;
  application_uuid?: string | null;
  deployment_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CoolifyVersion = {
  version?: string;
};

export type CoolifyHealth = {
  status?: string;
  message?: string;
};

export type CoolifyOverview = {
  applications: CoolifyApplication[];
  databases: CoolifyDatabase[];
  services: CoolifyService[];
  servers: CoolifyServer[];
  projects: CoolifyProject[];
  deployments: CoolifyDeployment[];
  version?: string;
  health?: CoolifyHealth;
};

export type CoolifyApiError = {
  message: string;
  status?: number;
};

export type ParsedStatus = {
  state: "healthy" | "running" | "warning" | "error" | "stopped" | "unknown";
  label: string;
  raw: string;
};

export type StatusCounts = {
  healthy: number;
  running: number;
  warning: number;
  error: number;
  stopped: number;
  unknown: number;
  total: number;
};
