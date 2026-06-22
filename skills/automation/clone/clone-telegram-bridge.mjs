#!/usr/bin/env node
// clone-telegram-bridge.mjs — a tiny, dependency-free reverse proxy for the Telegram Bot API.
//
// Run this on a host that CAN reach api.telegram.org (e.g. your own server). The clone then sets
// TELEGRAM_API_BASE to this server's URL and reaches Telegram *through* it — both directions, including
// getUpdates long-polling. The bot token is never stored here; it only passes through in the URL path,
// exactly as the clone sent it. Lock it down with TELEGRAM_BRIDGE_SECRET so it isn't an open relay, and
// put it behind TLS (your existing nginx/Caddy, or a cert) so the token isn't sent in the clear.
//
//   node clone-telegram-bridge.mjs                              # listen on 0.0.0.0:8787
//   PORT=9000 node clone-telegram-bridge.mjs                    # custom port
//   TELEGRAM_BRIDGE_SECRET=… node clone-telegram-bridge.mjs     # require the x-bridge-secret header
//
// Node 18+. Dependency-free (node:http + built-in fetch). See BRIDGE.md for systemd/nginx/Caddy recipes.

import http from 'node:http';

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const SECRET = process.env.TELEGRAM_BRIDGE_SECRET || '';
const UPSTREAM = (process.env.TELEGRAM_UPSTREAM || 'https://api.telegram.org').replace(/\/+$/, '');
const LONG_POLL_MS = Number(process.env.BRIDGE_TIMEOUT_MS || 120_000); // must exceed the getUpdates hold (~50s)

// Only ever proxy real Bot API paths: /bot<token>/<method>. Everything else is 404.
const BOT_PATH = /^\/bot\d{6,12}:[A-Za-z0-9_-]+\/[A-Za-z]+/;

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/' || req.url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }).end('clone-telegram-bridge ok'); return; }
    if (!BOT_PATH.test(req.url)) { res.writeHead(404).end('not found'); return; }
    if (SECRET && req.headers['x-bridge-secret'] !== SECRET) { res.writeHead(403).end('forbidden'); return; }

    // buffer the (small) request body
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), LONG_POLL_MS);
    try {
      const upstream = await fetch(`${UPSTREAM}${req.url}`, {
        method: req.method,
        headers: { 'content-type': req.headers['content-type'] || 'application/json' },
        body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : body,
        signal: ctrl.signal,
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json' });
      res.end(text);
    } finally { clearTimeout(timer); }
  } catch (e) {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, description: 'bridge upstream error: ' + (e && e.message || e) }));
  }
});

server.requestTimeout = 0;                         // don't cut off long-poll requests
server.keepAliveTimeout = LONG_POLL_MS + 10_000;
server.listen(PORT, HOST, () =>
  console.log(`clone-telegram-bridge → ${UPSTREAM} on ${HOST}:${PORT}` + (SECRET ? ' (secret required)' : ' (OPEN — set TELEGRAM_BRIDGE_SECRET!)')));
