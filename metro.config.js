const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');

const config = getDefaultConfig(__dirname);
const previous = config.server?.enhanceMiddleware;

// Web preview only. Phones call https://librivox.org directly.
// The proxy stays on librivox.org/api/feed so it is not an open proxy.
config.server = config.server ?? {};
config.server.enhanceMiddleware = (middleware, server) => {
  const next = typeof previous === 'function' ? previous(middleware, server) : middleware;
  return (req, res, nxt) => {
    const url = req.url ?? '';
    if (!url.startsWith('/librivox-proxy/')) return next(req, res, nxt);
    proxyLibrivox(url, res);
  };
};

function proxyLibrivox(rawUrl, res) {
  let incoming;
  try {
    incoming = new URL(rawUrl, 'http://localhost');
  } catch {
    res.statusCode = 400;
    res.end('bad url');
    return;
  }
  const path = incoming.pathname.replace(/^\/librivox-proxy/, '');
  if (!path.startsWith('/api/feed/')) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  const target = new URL(`https://librivox.org${path}${incoming.search}`);
  const request = https.request(
    target,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': 'Sesli/1.0 (personal audiobook; public LibriVox API)',
      },
    },
    (upstream) => {
      res.statusCode = upstream.statusCode || 502;
      res.setHeader('content-type', upstream.headers['content-type'] || 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'public, max-age=120');
      upstream.pipe(res);
    },
  );
  request.on('error', () => {
    if (res.headersSent) return;
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'upstream' }));
  });
  request.end();
}

module.exports = config;
