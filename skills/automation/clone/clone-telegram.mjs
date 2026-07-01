// clone-telegram.mjs — a thin, dependency-free Telegram Bot API client for the MASTER CLAUDE clone.
//
// The bot token comes ONLY from process.env.TELEGRAM_BOT_TOKEN — never inlined, never logged, never
// committed (keep it in a gitignored .env). Node 18+ (uses built-in fetch + AbortController).
//
// Exports: getMe, getUpdates, sendMessage (auto-chunked, Markdown→HTML), sendChatAction, getFile, downloadFile, call (low-level).
//
// Bridge: set TELEGRAM_API_BASE to a relay/reverse-proxy that CAN reach Telegram (e.g. your own server)
// when api.telegram.org is blocked from where the clone runs. The token still lives only in .env; the relay
// just forwards. An optional TELEGRAM_BRIDGE_SECRET is sent as the x-bridge-secret header so your relay can
// reject anyone but the clone. See clone-telegram-bridge.mjs + BRIDGE.md.

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_API_BASE = 'https://api.telegram.org';
const DEFAULT_TIMEOUT_MS = 65_000;
const MAX_LEN = 3500; // Telegram hard-limits a message at 4096; leave headroom for entities + added HTML tags.

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

// Split a long reply on natural boundaries (newline, else space) under the MAX_LEN cap.
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

// Escape the three characters that are special in Telegram's HTML parse mode.
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A NUL sentinel built at runtime (source stays pure ASCII) — it can't occur in real chat text, so the
// placeholders used to shield code spans never collide with a user's bare number or bracket.
const SENT = String.fromCharCode(0);
const RESTORE = new RegExp(SENT + '(\\d+)' + SENT, 'g');

// Convert the lightweight Markdown the clone writes (**bold**, *italic*, `code`, ```blocks```, ~~strike~~,
// [text](url), # headings) into the small subset of HTML that Telegram's parse_mode:'HTML' accepts, so the
// formatting actually renders instead of showing the raw markers. Code spans are pulled out first (into
// sentinel-delimited placeholders) so their contents are never re-interpreted; everything else is HTML-escaped
// before tags are applied.
export function mdToTelegramHtml(src) {
  const codes = [];
  const stash = (html) => { codes.push(html); return SENT + (codes.length - 1) + SENT; };
  let t = String(src == null ? '' : src);
  // 1) fenced + inline code → placeholders (escaped, never touched by later rules)
  t = t.replace(/```[a-zA-Z0-9_+-]*\n?([\s\S]*?)```/g, (_, c) => stash(`<pre>${escHtml(c.replace(/\n$/, ''))}</pre>`));
  t = t.replace(/`([^`\n]+)`/g, (_, c) => stash(`<code>${escHtml(c)}</code>`));
  // 2) escape the rest of the text
  t = escHtml(t);
  // 3) links, headings, emphasis (order matters: ** before single *)
  t = t.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, txt, url) => `<a href="${url}">${txt}</a>`);
  t = t.replace(/^[ \t]*#{1,6}[ \t]+(.+?)[ \t]*$/gm, '<b>$1</b>');
  t = t.replace(/\*\*([^\n]+?)\*\*/g, '<b>$1</b>');
  t = t.replace(/__([^\n]+?)__/g, '<b>$1</b>');
  t = t.replace(/~~([^\n]+?)~~/g, '<s>$1</s>');
  t = t.replace(/(^|[\s(])\*(?!\s)([^\n*]+?)\*(?=[\s).,!?:;؛،]|$)/g, '$1<i>$2</i>');
  t = t.replace(/(^|[\s(])_(?!\s)([^\n_]+?)_(?=[\s).,!?:;؛،]|$)/g, '$1<i>$2</i>');
  // 4) restore code placeholders
  t = t.replace(RESTORE, (_, i) => codes[Number(i)]);
  return t;
}

// Send a (possibly long) message as one or more chunks, in order. Markdown is rendered via Telegram HTML; if a
// chunk's entities don't parse (e.g. a marker split across a chunk boundary) we resend that chunk as plain text
// so a formatting glitch can NEVER swallow a reply. Pass { format:false } for raw text (e.g. system notices).
export async function sendMessage(chat_id, text, { format = true } = {}) {
  const parts = chunk(text);
  const results = [];
  for (const part of parts) {
    const base = { chat_id, disable_web_page_preview: true };
    let result;
    if (format) {
      try {
        result = await call('sendMessage', { ...base, text: mdToTelegramHtml(part), parse_mode: 'HTML' });
      } catch (e) {
        if (/parse|entit|tag|unsupported/i.test(e.message)) result = await call('sendMessage', { ...base, text: part });
        else throw e;
      }
    } else {
      result = await call('sendMessage', { ...base, text: part });
    }
    results.push(result);
    if (parts.length > 1) await sleep(350); // gentle on per-chat flood limits
  }
  return results;
}

// Resolve a file_id to a downloadable file (Bot API getFile; serves files up to ~20MB).
export const getFile = (file_id) => call('getFile', { file_id });

// Download a Telegram attachment by file_id to destPath. Streamed safely:
//   • a hard byte cap (maxBytes) is enforced from getFile's file_size, the response content-length, AND the
//     actual bytes — a missing/lying content-length can't smuggle an oversize file onto the disk;
//   • the file download endpoint is <base>/file/bot<token>/<file_path> — a DIFFERENT path from the
//     /bot<token>/<method> API calls. Bridge-aware: when TELEGRAM_API_BASE is set, downloads go through the
//     same relay (which must proxy /file/bot… — see clone-telegram-bridge.mjs) and carry x-bridge-secret;
//   • the bot token only ever appears in the request URL — it is NEVER logged or returned;
//   • a partial/over-cap file is unlinked, so a failed download never leaves a truncated artifact behind.
// Returns { path, size, file_path }. Throws on cap-exceed, HTTP error, or timeout.
export async function downloadFile(file_id, destPath, { maxBytes = 20 * 1024 * 1024, timeoutMs = 120_000 } = {}) {
  const f = await getFile(file_id);                       // { file_path, file_size, file_unique_id, ... }
  if (!f || !f.file_path) throw new Error('getFile returned no file_path');
  if (f.file_size && f.file_size > maxBytes) throw new Error(`file too large (${f.file_size} > ${maxBytes})`);
  const ctrl = new AbortController();
  inflight.add(ctrl);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const headers = {};
    const secret = process.env.TELEGRAM_BRIDGE_SECRET; // optional relay secret (never logged)
    if (secret) headers['x-bridge-secret'] = secret;
    const res = await fetch(`${apiBase()}/file/bot${token()}/${f.file_path}`, { headers, signal: ctrl.signal });
    if (!res.ok) throw new Error(`file download HTTP ${res.status}`);
    const len = Number(res.headers.get('content-length') || 0);
    if (len && len > maxBytes) throw new Error(`file too large (content-length ${len} > ${maxBytes})`);
    const buf = Buffer.from(await res.arrayBuffer());     // capped ≤ maxBytes (~20MB) — safe to buffer in memory
    if (buf.length > maxBytes) throw new Error(`file exceeded cap (${buf.length} > ${maxBytes})`);
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.writeFile(destPath, buf);
    return { path: destPath, size: buf.length, file_path: f.file_path };
  } catch (e) {
    try { await fs.promises.unlink(destPath); } catch {}  // never leave a partial/over-cap artifact
    throw e;
  } finally {
    clearTimeout(timer);
    inflight.delete(ctrl);
  }
}
