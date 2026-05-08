import { apiRequest } from './client';

export interface Log360Health {
  configured: boolean;
  ok: boolean;
  productVersion?: string;
  user?: string;
  error?: string;
}

export interface Log360Source {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeenAt?: string;
}

export interface Log360Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  status: 'open' | 'closed' | 'unknown';
  createdAt: string;
  title: string;
}

export interface Log360ScoreBreakdown {
  score: number;
  weight: number;
  reason: string;
}

export interface Log360Summary {
  configured: boolean;
  ok: boolean;
  productVersion?: string;
  fetchedAt: string;
  sources: { total: number; online: number; offline: number; unknown: number; samples: Log360Source[] };
  alerts: { total: number; open: number; closed: number; bySeverity: Record<string, number>; samples: Log360Alert[] };
  retention: { retentionDays: number; archiveEnabled: boolean };
  score: {
    overall: number;
    breakdown: {
      health: Log360ScoreBreakdown;
      coverage: Log360ScoreBreakdown;
      detection: Log360ScoreBreakdown;
      response: Log360ScoreBreakdown;
      retention: Log360ScoreBreakdown;
    };
    band: 'compliant' | 'attention' | 'at-risk';
  };
  errors: string[];
}

export const log360Api = {
  health(): Promise<Log360Health> {
    return apiRequest<Log360Health>('/integrations/log360/health');
  },
  summary(): Promise<Log360Summary> {
    return apiRequest<Log360Summary>('/integrations/log360/summary');
  },
};
