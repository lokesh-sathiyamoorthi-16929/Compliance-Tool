import type { JobStatusResponse, SearchQuery } from './types';
import type { Log360ApiClient } from './client';

export function createSearchApi(client: Log360ApiClient) {
  return {
    async sync(query: SearchQuery) {
      return client.request<Record<string, unknown>>('POST', '/api/v2/search', { body: query });
    },

    async submitAsync(query: SearchQuery) {
      return client.request<{ response?: { job_id?: string } }>('POST', '/api/v2/search/async', { body: query });
    },

    async getJobStatus(jobId: string): Promise<JobStatusResponse> {
      const payload = await client.request<{ response?: JobStatusResponse }>('GET', `/api/v2/jobs/${encodeURIComponent(jobId)}`);
      return payload.response ?? { job_id: jobId, status: 'queued' };
    },

    async getJobResults(jobId: string) {
      return client.request<Record<string, unknown>>('GET', `/api/v2/jobs/${encodeURIComponent(jobId)}/results`);
    },

    async runAsyncSearch(query: SearchQuery, options: { maxAttempts?: number; pollMs?: number } = {}) {
      const maxAttempts = options.maxAttempts ?? 15;
      const pollMs = options.pollMs ?? 2000;

      const created = await this.submitAsync(query);
      const jobId = created.response?.job_id;

      if (!jobId) {
        throw new Error('Async search did not return a job_id');
      }

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const status = await this.getJobStatus(jobId);
        if (status.status === 'completed') {
          return this.getJobResults(jobId);
        }
        if (status.status === 'failed') {
          throw new Error(`Async search job ${jobId} failed`);
        }
        await new Promise((resolve) => setTimeout(resolve, pollMs));
      }

      throw new Error(`Async search job ${jobId} timed out after ${maxAttempts} attempts`);
    },
  };
}
