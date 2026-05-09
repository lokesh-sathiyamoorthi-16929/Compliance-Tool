import type { IncomingMessage, ServerResponse } from 'http';

type ProxyRequest = IncomingMessage & {
  url?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
};

function getHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function getAllowedHosts(): string[] {
  return (process.env.LOG360_PROXY_ALLOWLIST ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function isTargetAllowed(target: URL, allowedHosts: string[]): boolean {
  if (!['http:', 'https:'].includes(target.protocol)) return false;
  if (allowedHosts.length === 0) return false;

  const host = target.host.toLowerCase();
  return allowedHosts.includes(host);
}

async function readBody(req: IncomingMessage): Promise<string | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: ProxyRequest, res: ServerResponse) {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const targetRaw = requestUrl.searchParams.get('target');

    if (!targetRaw) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing target query parameter.' }));
      return;
    }

    const target = new URL(targetRaw);
    const allowedHosts = getAllowedHosts();

    if (!isTargetAllowed(target, allowedHosts)) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Proxy target is not allowed. Set LOG360_PROXY_ALLOWLIST with approved host:port values.',
        }),
      );
      return;
    }

    const authorization = getHeaderValue(req.headers.authorization);
    if (!authorization.startsWith('Bearer ')) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing or invalid Authorization header.' }));
      return;
    }

    const method = req.method || 'GET';
    const body = method === 'GET' ? undefined : await readBody(req);

    const response = await fetch(target.toString(), {
      method,
      headers: {
        Authorization: authorization,
        'Content-Type': 'application/json',
      },
      body,
    });

    const text = await response.text();
    res.statusCode = response.status;
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.end(text);
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Proxy request failed.' }));
  }
}
