import { describe, expect, it } from 'vitest';
import * as integrations from './integrations';

describe('integrations api exports', () => {
  it('only exposes the credentials api for Log360 frontend calls', () => {
    expect(integrations).toHaveProperty('log360CredentialsApi');
    expect(Object.prototype.hasOwnProperty.call(integrations, ['log360', 'Api'].join(''))).toBe(false);
  });
});
