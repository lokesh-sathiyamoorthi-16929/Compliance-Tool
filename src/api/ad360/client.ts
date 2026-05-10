import type { Ad360ConnectionConfig, Ad360Health } from './types';

export class Ad360Client {
  constructor(private readonly config?: Ad360ConnectionConfig) {}

  isConfigured(): boolean {
    return Boolean(this.config?.baseUrl && this.config?.username && this.config?.password);
  }

  async health(): Promise<Ad360Health> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        configured: false,
        message: 'AD360 is not configured. Using stub response.',
      };
    }

    return {
      ok: true,
      configured: true,
      message: 'AD360 stub client configured.',
    };
  }
}
