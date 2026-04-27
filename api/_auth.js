export function requireAuth(req, res) {
  const user = process.env.DASHBOARD_USER;
  const pass = process.env.DASHBOARD_PASSWORD;
  if (!user || !pass) {
    res.status(500).json({ error: 'Missing DASHBOARD_USER or DASHBOARD_PASSWORD env vars.' });
    return false;
  }
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Sprint Review Dashboard"');
    res.status(401).end('Authentication required');
    return false;
  }
  const encoded = authHeader.slice('Basic '.length);
  let decoded;
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    res.setHeader('WWW-Authenticate', 'Basic realm="Sprint Review Dashboard"');
    res.status(401).end('Invalid authorization header');
    return false;
  }
  const colonIndex = decoded.indexOf(':');
  if (colonIndex === -1) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Sprint Review Dashboard"');
    res.status(401).end('Invalid authorization format');
    return false;
  }
  const inputUser = decoded.slice(0, colonIndex);
  const inputPass = decoded.slice(colonIndex + 1);
  if (inputUser !== user || inputPass !== pass) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Sprint Review Dashboard"');
    res.status(401).end('Unauthorized');
    return false;
  }
  return true;
}
