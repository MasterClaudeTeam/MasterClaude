// clone-telegram.mjs — a thin, dependency-free Telegram Bot API client for the MASTER CLAUDE clone.
//
// The bot token comes ONLY from process.env.TELEGRAM_BOT_TOKEN — never inlined, never logged, never
// committed (keep it in a gitignored .env). Node 18+ (uses built-in fetch + AbortController).
//
// Exports: getMe, getUpdates, sendMessage (auto-chunked), sendChatAction, call (low-level).
//
// Bridge: set TELEGRAM_API_BASE to a relay/reverse-proxy that CAN reach Telegram (e.g. your own server)
// when api.telegram.org is blocked from where the clone runs. The token still lives only in .env; the relay
// just forwards. An optional TELEGRAM_BRIDGE_SECRET is sent as the x-bridge-secret header so your relay can
// reject anyone but the clone. See clone-telegram-bridge.mjs + BRIDGE.md.

const DEFAULT_API_BASE = 'https://api.telegram.org';
const DEFAULT_TIMEOUT_MS = 65_000;
const MAX_LEN = 4000; // Telegram hard-limits a message at 4096; leave headroom for entities.

function token() {
  const t = process.env.TELEGRAM_BOT_TOKEN;
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN is not set — put it in a gitignored .env (never inline it).');
  return t;
}

// Read lazily (NOT at module top level): this module is imported before the caller's loadEnv() runs, since
// ESM imports are evaluated before the importing file's body — so reading here picks up values from .env.
function apiBase() { return (process.env.TELEGRAM_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, ''); }
export function usingBridge() { return !!process.env.TELEGRAM_API_BASE; }

// In-flight requests, so a shutdown (Ctrl-C) can cancel a blocking long-poll immediately instead of
// waiting out the ~50s getUpdates hold. abortAll() rejects every pending call with an AbortError.
const inflight = new Set();
export function abortAll() { for (const c of inflight) { try { c.abort(); } catch {} } inflight.clear(); }

// Low-level API call with a fetch timeout and automatic 429 (flood) back-off.
export async function call(method, params = {}, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  inflight.add(ctrl);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = { 'content-type': 'application/json' };
    const secret = process.env.TELEGRAM_BRIDGE_SECRET; // optional shared secret for your relay (never logged)
    if (secret) headers['x-bridge-secret'] = secret;
    const res = await fetch(`${apiBase()}/bot${token()}/${method}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
      const wait = ((data.parameters && data.parameters.retry_after) || 1) * 1000;
      await sleep(wait);
      return call(method, params, { timeoutMs });
    }
    if (!data.ok) throw new Error(`Telegram ${method}: ${data.description || ('HTTP ' + res.status)}`);
    return data.result;
  } finally {
    clearTimeout(timer);
    inflight.delete(ctrl);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const getMe = () => call('getMe');

export const getUpdates = (offset, timeout = 50) =>
  call(
    'getUpdates',
    { offset, timeout, allowed_updates: ['message'] },
    { timeoutMs: (timeout + 15) * 1000 }, // long-poll: wait a bit longer than the server hold
  );

export const sendChatAction = (chat_id, action = 'typing') => call('sendChatAction', { chat_id, action });

// Split a long reply on natural boundaries (newline, else space) under the 4000-char cap.
export function chunk(text) {
  const out = [];
  let s = String(text == null ? '' : text).trim() || '(no reply)';
  while (s.length > MAX_LEN) {
    let cut = s.lastIndexOf('\n', MAX_LEN);
    if (cut < MAX_LEN * 0.6) cut = s.lastIndexOf(' ', MAX_LEN);
    if (cut < MAX_LEN * 0.6) cut = MAX_LEN;
    out.push(s.slice(0, cut));
    s = s.slice(cut).replace(/^\s+/, '');
  }
  if (s) out.push(s);
  return out;
}

// Send a (possibly long) message as one or more chunks, in order.
export async function sendMessage(chat_id, text) {
  const parts = chunk(text);
  const results = [];
  for (const part of parts) {
    results.push(await call('sendMessage', { chat_id, text: part, disable_web_page_preview: true }));
    if (parts.length > 1) await sleep(350); // gentle on per-chat flood limits
  }
  return results;
}
