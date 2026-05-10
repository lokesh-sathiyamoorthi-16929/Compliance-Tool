import { createLog360Client, getLog360DebugCalls, paginate } from './client';
import { createAlertsApi } from './alerts';
import { createIncidentsApi } from './incidents';
import { createLogSourcesApi } from './logSources';
import { createLogTypesApi } from './logTypes';
import { createMetadataApi } from './metadata';
import { createReportsApi } from './reports';
import { createSearchApi } from './search';
import type { Log360ConnectionConfig } from './types';

export * from './types';
export * from './auth';
export { paginate, getLog360DebugCalls };

export function createLog360Api(config?: Log360ConnectionConfig) {
  const client = createLog360Client(config);
  return {
    client,
    metadata: createMetadataApi(client),
    logSources: createLogSourcesApi(client),
    incidents: createIncidentsApi(client),
    alerts: createAlertsApi(client),
    reports: createReportsApi(client),
    logTypes: createLogTypesApi(client),
    search: createSearchApi(client),
  };
}
