import fs from 'fs';
import path from 'path';
import { requireAuth } from './_auth.js';

export default async function handler(req, res) {
  // Verify Basic Auth
  if (!requireAuth(req, res)) return;

  // Serve dashboard.html
  try {
    const htmlPath = path.join(process.cwd(), 'dashboard.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).end(html);
  } catch (err) {
    res.status(500).end('Could not load dashboard: ' + err.message);
  }
}
