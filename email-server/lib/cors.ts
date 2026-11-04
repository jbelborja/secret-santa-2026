import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Set CORS headers for cross-origin requests from the RN app / web app.
 * Returns true if the request was a preflight (OPTIONS) that was already handled.
 */
export function cors(req: VercelRequest, res: VercelResponse): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
