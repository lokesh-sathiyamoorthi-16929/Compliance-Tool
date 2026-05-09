import type { IncomingMessage, ServerResponse } from 'http';

async function readBody(req: IncomingMessage): Promise<string | undefined> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks).toString('utf-8');
}

export default async function handler(req: IncomingMessage & { url?: string; method?: string; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    const target = requestUrl.searchParams.get('target');

    if (!target) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing target query parameter.' }));
      return;
    }

    const method = req.method || 'GET';
    const body = method === 'GET' ? undefined : await readBody(req);

    const response = await fetch(target, {
      method,
      headers: {
        Authorization: String(req.headers.authorization || ''),
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
