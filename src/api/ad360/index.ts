import { Ad360Client } from './client';
import type { Ad360ConnectionConfig } from './types';

export * from './types';

export function createAd360Api(config?: Ad360ConnectionConfig) {
  const client = new Ad360Client(config);
  return {
    client,
    health: () => client.health(),
  };
}
