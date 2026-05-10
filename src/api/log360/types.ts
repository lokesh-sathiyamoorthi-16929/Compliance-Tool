export interface Log360ApiError {
  code?: string;
  title?: string;
  detail?: string;
  httpStatus?: number;
}

export interface PaginationMeta {
  from?: number;
  limit?: number;
  total?: number;
}

export interface Log360ListResponse<T> {
  response: T;
  meta?: PaginationMeta & Record<string, unknown>;
}

export interface Log360ConnectionConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  useProxy?: boolean;
}

export interface Log360TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
}

export interface Log360SessionToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Log360User {
  user_id: string;
  username: string;
  display_name?: string;
  email?: string;
}

export interface LogField {
  field_name: string;
  display_name?: string;
  data_type?: string;
  category?: string;
  operators?: string[];
}

export interface LogSource {
  id: string;
  log_source: string;
  domain_name?: string;
  agent_id?: string;
  status?: string;
  type?: string;
  [key: string]: unknown;
}

export interface Agent {
  id: string;
  name: string;
  status?: string;
  [key: string]: unknown;
}

export interface Domain {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Computer {
  id: string;
  name: string;
  domain_name?: string;
  [key: string]: unknown;
}

export interface LogSourceGroup {
  id: string;
  name: string;
  member_count?: number;
  [key: string]: unknown;
}

export type IncidentSeverity = 'critical' | 'trouble' | 'attention';
export type IncidentStatus = 'open' | 'in_progress' | 'closed';
export type IncidentSource = 'search' | 'report' | 'alert';

export interface IncidentActor {
  name: string;
  type?: string;
}

export interface IncidentNote {
  note: string;
  created_time?: string;
}

export interface IncidentEvidence {
  name: string;
  value: string;
}

export interface IncidentActivity {
  action: string;
  created_time?: string;
}

export interface Incident {
  incident_id: string;
  name: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignee?: string;
  due_date?: string;
  created_time?: string;
  updated_time?: string;
  actors?: IncidentActor[];
  notes?: IncidentNote[];
  evidence?: IncidentEvidence[];
  activity?: IncidentActivity[];
  source?: IncidentSource;
  [key: string]: unknown;
}

export interface CreateIncidentRequest {
  name: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  assignee?: string;
  due_date?: string;
  notes?: IncidentNote[];
  evidence?: IncidentEvidence[];
  source?: IncidentSource;
}

export interface Alert {
  alert_id: string;
  name: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'open' | 'closed';
  created_time?: string;
  [key: string]: unknown;
}

export interface AlertProfile {
  profile_id: string;
  name: string;
  [key: string]: unknown;
}

export interface ReportProfile {
  profile_id: string;
  name: string;
  unique_key?: string;
  retention_days?: number;
  [key: string]: unknown;
}

export interface ReportDataResponse {
  response: {
    rows?: Array<Record<string, unknown>>;
  } | Array<Record<string, unknown>>;
  meta?: Record<string, unknown>;
}

export interface LogType {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ParserRule {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface SearchJobResponse {
  job_id: string;
  status?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
}

export interface SearchQuery {
  query: string;
  from_time?: string;
  to_time?: string;
  limit?: number;
}

export interface DebugApiCall {
  id: string;
  method: string;
  path: string;
  status: number;
  elapsedMs: number;
  at: string;
}

export interface PaginationInput {
  from?: number;
  limit?: number;
}
