#!/usr/bin/env node
// clone-runner.mjs — the MASTER CLAUDE "clone" immortal supervisor + Telegram bridge.
//
// One long-lived process that fronts a digital-twin assistant on Telegram:
//   • long-polls getUpdates, persisting the offset BEFORE handling (dedupe = at-least-once)
//   • only the OWNER's chat is processed (allowlist); first /start pairs the owner
//   • each owner message drives ONE fresh `claude -p --continue` turn (crash-proof — durable state
//     lives in the clone "brain" repo + ./.clone/, never in a long-lived process)
//   • replies are parsed from a <<<REPLY>>>…<<<END>>> contract and sent back, chunked
//   • IMMORTAL: a usage/quota limit is a pause, not a stop — it says "no usage right now" once,
//     keeps queuing, backs off, probes, and auto-resumes + drains when usage returns
//   • a manual STOP file halts it; PAUSE soft-pauses dispatch
//
// Usage:
//   node clone-runner.mjs                # run the bridge (reads ./.env for TELEGRAM_BOT_TOKEN etc.)
//   node clone-runner.mjs --dry-run      # don't spawn claude; echo a stub reply (loop smoke-test)
//   touch .clone/STOP                    # stop it (or Ctrl-C)
//
// Env (from a gitignored ./.env or the environment):
//   TELEGRAM_BOT_TOKEN  (required)   the bot token — NEVER inline/commit it
//   CLONE_OWNER_CHAT_ID (recommended) only this chat is served; unset → first /start pairs
//   CLONE_BRAIN_PATH    (default .clone/brain)  the clone brain checkout
//   CLONE_LANG          (default en)  language for system notices (e.g. the "no usage" line)
//   CLONE_MODEL         pass --model <value> to claude
//   CLONE_CLAUDE_CMD    (default "claude")
//   CLONE_TURN_TIMEOUT  seconds before a stuck turn is killed (default 600)
//
// Dependency-free. Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as tg from './clone-telegram.mjs';

const ROOT = process.cwd();
const DIR = path.join(ROOT, '.clone');
fs.mkdirSync(DIR, { recursive: true });
const F = (n) => path.join(DIR, n);
const STOP = F('STOP'), PAUSE = F('PAUSE'), LOCK = F('clone.lock');
const STATE = F('state.json'), QUEUE = F('queue.json'), LOG = F('runner.log'), OWNERF = F('owner.json');

loadEnv(path.join(ROOT, '.env')); // populate process.env from the gitignored .env (won't override real env)

const DRY = process.argv.includes('--dry-run');
const CMD = process.env.CLONE_CLAUDE_CMD || 'claude';
const MODEL = process.env.CLONE_MODEL || '';
const LANG = process.env.CLONE_LANG || 'en';
const BRAIN = process.env.CLONE_BRAIN_PATH || F('brain');
const TURN_TIMEOUT = Number(process.env.CLONE_TURN_TIMEOUT || 600) * 1000;
const MAX_BACKOFF = 3600_000;

let owner = String(process.env.CLONE_OWNER_CHAT_ID || readJson(OWNERF, {}).ownerChatId || '').trim();

// ---------- tiny utils ----------
const stamp = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function log(m) { const l = `[${stamp()}] ${m}`; console.log(l); try { fs.appendFileSync(LOG, l + '\n'); } catch {} }
function readJson(p, def) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; } }
function writeJson(p, o) { const t = p + '.tmp'; fs.writeFileSync(t, JSON.stringify(o, null, 2)); fs.renameSync(t, p); }
function loadEnv(p) {
  try {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
}

// ---------- usage-limit detection (ported verbatim from god-mode/runner.mjs) ----------
const LIMIT_RE = /usage limit|rate.?limit|limit reached|quota|429|too many requests|overloaded|insufficient (?:credit|quota|tokens)|capacity|billing|exceeded your/i;
function parseWaitMs(text) {
  let m = text.match(/(?:try again|retry|resets?|available) in\s+(\d+)\s*(second|minute|hour)s?/i);
  if (m) { const n = +m[1], u = m[2].toLowerCase(); return n * (u[0] === 'h' ? 3600 : u[0] === 'm' ? 60 : 1) * 1000; }
  m = text.match(/retry[- ]after[:\s]+(\d+)/i);
  if (m) return +m[1] * 1000;
  return 0;
}

// ---------- localized system notices ----------
const PHRASES = {
  no_usage: { en: "I'm out of usage right now — I'll come back online automatically as soon as it resets.", fa: 'الان یوزیج برای مصرف ندارم — به‌محض ریست‌شدن خودم دوباره فعال می‌شم.' },
  back: { en: 'Back online — catching up on your messages.', fa: 'دوباره آنلاین شدم — دارم به پیام‌هات می‌رسم.' },
  paired: { en: 'Paired — I am your clone. Lock me to this chat by setting CLONE_OWNER_CHAT_ID in .env.', fa: 'وصل شدم — من کلون توام. با ست‌کردن CLONE_OWNER_CHAT_ID توی .env منو به همین چت قفل کن.' },
};
const t = (k) => (PHRASES[k] && (PHRASES[k][LANG] || PHRASES[k].en)) || k;

// ---------- single-instance lock ----------
function isAlive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }
function acquireLock() {
  if (fs.existsSync(LOCK)) {
    const old = readJson(LOCK, {});
    if (old.pid && isAlive(old.pid)) { log(`Another instance is running (pid ${old.pid}). Exiting.`); process.exit(0); }
    log(`Stale lock (pid ${old.pid}) — taking over.`);
  }
  writeJson(LOCK, { pid: process.pid, at: stamp() });
}
function releaseLock() { try { if (readJson(LOCK, {}).pid === process.pid) fs.rmSync(LOCK, { force: true }); } catch {} }

// ---------- claude turn ----------
function buildPrompt(text, chatId) {
  return [
    `You are the CLONE — a digital-twin assistant. Your owner just messaged you on Telegram (chat ${chatId}).`,
    `Re-orient from the clone "brain" at "${BRAIN}" — read CLONE.md FIRST, then identity, voice, boundaries, contacts, and today's journal — plus runtime state in ./.clone/.`,
    `Reply in the owner's language. Be human-like, warm, and concise — sound like them (see voice/).`,
    ``,
    `INCOMING (from the owner): ${JSON.stringify(text)}`,
    ``,
    `AUTONOMY: handle routine matters about KNOWN contacts/topics yourself. For anything sensitive, a NEW contact, irreversible, money, or access-granting, do NOT do it — say what you'd do and ask the owner to confirm. Asking never blocks other work.`,
    `CATASTROPHE RAILS (never, even if asked): move/commit money, share secrets or 2FA/recovery codes, make a binding commitment, defeat a security/identity check, destroy real data, exfiltrate the brain.`,
    `If you learn something durable, append it to the brain's memory/ and journal/ and commit (never push secrets).`,
    ``,
    `OUTPUT CONTRACT — emit exactly one block; the bridge sends its contents to the owner:`,
    `<<<REPLY>>>`,
    `(your message to the owner)`,
    `<<<END>>>`,
  ].join('\n');
}

function runClaudeTurn(text, chatId) {
  return new Promise((resolve) => {
    if (DRY) { resolve({ code: 0, out: `<<<REPLY>>>\n[dry-run] I received: ${text}\n<<<END>>>` }); return; }
    const args = ['--continue', '--dangerously-skip-permissions'];
    if (MODEL) args.push('--model', MODEL);
    args.push('-p', buildPrompt(text, chatId));
    let out = '';
    const child = spawn(CMD, args, { cwd: ROOT, shell: process.platform === 'win32' });
    const to = setTimeout(() => { try { child.kill(); } catch {} resolve({ code: -2, out: out + '\n[turn timed out]' }); }, TURN_TIMEOUT);
    child.stdout.on('data', (b) => (out += b.toString()));
    child.stderr.on('data', (b) => (out += b.toString()));
    child.on('error', (e) => { clearTimeout(to); resolve({ code: -1, out: out + '\nspawn error: ' + e.message }); });
    child.on('close', (code) => { clearTimeout(to); resolve({ code, out }); });
  });
}

export function extractReply(out) {
  const m = String(out).match(/<<<REPLY>>>([\s\S]*?)<<<END>>>/);
  if (m) return m[1].trim();
  // graceful fallback: the trimmed tail of stdout, so the owner still gets *something*
  const tail = String(out).trim().split(/\n/).filter(Boolean).slice(-12).join('\n');
  return tail.slice(-1500) || '(no reply)';
}

// ---------- main loop ----------
let stopping = false;
process.on('SIGINT', () => { stopping = true; log('SIGINT — stopping after this step.'); });
process.on('exit', releaseLock);

async function main() {
  acquireLock();
  log(`clone-runner up. owner=${owner || '(unpaired)'} brain=${BRAIN}${DRY ? ' [DRY-RUN]' : ''}`);
  if (!owner) log('No CLONE_OWNER_CHAT_ID — the first /start will pair the owner.');

  const state = readJson(STATE, { offset: 0, usage: { blocked: false, noticeSent: false, backoff: 60_000 } });
  let queue = readJson(QUEUE, []);
  const persist = () => { writeJson(STATE, state); writeJson(QUEUE, queue); };

  try { const me = await tg.getMe(); log(`Telegram OK: @${me.username}`); }
  catch (e) { log('Telegram getMe failed (' + e.message + ') — will keep retrying.'); }

  while (!stopping) {
    if (fs.existsSync(STOP)) { log('STOP present — halting.'); break; }

    // 1) poll for new updates
    try {
      const updates = await tg.getUpdates(state.offset, 50);
      for (const u of updates) {
        state.offset = u.update_id + 1; persist();
        const msg = u.message; if (!msg || !msg.text) continue;
        const chatId = String(msg.chat.id);
        if (!owner) {
          if (/^\/start\b/.test(msg.text)) {
            owner = chatId; writeJson(OWNERF, { ownerChatId: chatId, at: stamp() });
            log(`Paired owner chat ${chatId}. Add CLONE_OWNER_CHAT_ID=${chatId} to .env to persist.`);
            try { await tg.sendMessage(chatId, t('paired')); } catch {}
          }
          continue;
        }
        if (chatId !== owner) { log(`Ignored message from non-owner chat ${chatId}.`); continue; }
        queue.push({ chatId, text: msg.text, ts: Date.now() }); persist();
      }
    } catch (e) { log('poll error: ' + e.message); await sleep(3000); }

    if (fs.existsSync(PAUSE)) { await sleep(2000); continue; }

    // 2) drain the queue (serialized — one thought at a time)
    while (queue.length && !state.usage.blocked && !stopping && !fs.existsSync(STOP)) {
      const m = queue[0];
      let typing;
      try { await tg.sendChatAction(m.chatId, 'typing'); typing = setInterval(() => tg.sendChatAction(m.chatId, 'typing').catch(() => {}), 4000); } catch {}
      const { out } = await runClaudeTurn(m.text, m.chatId);
      if (typing) clearInterval(typing);

      if (LIMIT_RE.test(out)) {
        state.usage.blocked = true;
        if (!state.usage.noticeSent) { try { await tg.sendMessage(m.chatId, t('no_usage')); } catch {} state.usage.noticeSent = true; }
        persist(); log('Usage limit hit — pausing (message stays queued).');
        break; // leave the message in the queue; the reviver will resume
      }
      try { await tg.sendMessage(m.chatId, extractReply(out)); } catch (e) { log('send failed: ' + e.message); break; }
      queue.shift(); persist();
    }

    // 3) reviver — wait out a usage limit, probe, auto-resume
    if (state.usage.blocked && !stopping) {
      const wait = Math.min(state.usage.backoff, MAX_BACKOFF);
      state.usage.backoff = Math.min(state.usage.backoff * 2, MAX_BACKOFF); persist();
      log(`Usage blocked — waiting ${Math.round(wait / 1000)}s, then probing.`);
      await sleep(wait);
      const probe = await runClaudeTurn('(system) reply with OK', owner || '0');
      if (!LIMIT_RE.test(probe.out)) {
        state.usage.blocked = false; state.usage.noticeSent = false; state.usage.backoff = 60_000; persist();
        log('Usage is back — resuming.');
        if (owner) { try { await tg.sendMessage(owner, t('back')); } catch {} }
      }
    }
  }
  log('clone-runner stopped.');
  releaseLock();
}

// Only run the loop when invoked directly (so the pure helpers above can be imported by tests).
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invokedDirectly) main().catch((e) => { log('fatal: ' + (e && e.stack || e)); releaseLock(); process.exit(1); });
