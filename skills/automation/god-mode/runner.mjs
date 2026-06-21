#!/usr/bin/env node
// MASTER CLAUDE — GOD mode runner.
// Keeps an autonomous Claude Code session alive across usage limits and errors: it launches the
// Claude CLI to do one cycle of work, and when that cycle ends it decides what to do next —
//   • hit a usage / rate limit  → back off, then RE-LAUNCH automatically when usage returns
//   • crashed / errored         → short backoff, then re-launch (never gives up)
//   • finished a chunk (exit 0) → brief pause, then launch the next cycle
//   • saw STOP or DONE          → exit
// Only a manual STOP (the STOP file or Ctrl-C) ends it. A usage limit is a pause, not a stop.
//
// Usage:
//   node .claude/skills/automation/god-mode/runner.mjs ["optional mission goal"]
//   node .claude/skills/automation/god-mode/runner.mjs --zeus   # ZEUS: dangerously, never-ask tier
//   touch .master-claude/god-mode/STOP      # stop it (or press Ctrl-C)
//
// Env (all optional):
//   GOD_ZEUS         "1" = ZEUS mode (same as --zeus): forces --dangerously-skip-permissions, never asks
//   GOD_CLAUDE_CMD   the CLI binary           (default: "claude")
//   GOD_MODEL        pass --model <value>      (default: none → your CLI default)
//   GOD_USE_CONTINUE "1" to add --continue (resume the same conversation; default: fresh each cycle,
//                    relying on the on-disk state — the most crash-proof mode)
//   GOD_SAFE         "1" to DROP --dangerously-skip-permissions (Claude will prompt; not unattended)
//   GOD_MAX_CYCLES   stop after N cycles       (default: 0 = unlimited)
//   GOD_MAX_BACKOFF  cap backoff seconds       (default: 3600)
//
// Dependency-free. Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(fs.readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 24).join('\n').replace(/^\/\/ ?/gm, ''));
  process.exit(0);
}
const goal = args.filter((a) => !a.startsWith('-')).join(' ').trim();

const ROOT = process.cwd();
const DIR = path.join(ROOT, '.master-claude', 'god-mode');
const STOP = path.join(DIR, 'STOP');
const DONE = path.join(DIR, 'DONE');
const LOG = path.join(DIR, 'runner.log');
fs.mkdirSync(DIR, { recursive: true });

const CMD = process.env.GOD_CLAUDE_CMD || 'claude';
const MAX_CYCLES = Number(process.env.GOD_MAX_CYCLES || 0);
const MAX_BACKOFF = Number(process.env.GOD_MAX_BACKOFF || 3600) * 1000;
const SAFE = process.env.GOD_SAFE === '1';
const ZEUS = args.includes('--zeus') || process.env.GOD_ZEUS === '1'; // dangerously, never-ask tier

const stamp = () => new Date().toISOString();
function log(msg) {
  const line = `[${stamp()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG, line + '\n'); } catch {}
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let stopping = false;
process.on('SIGINT', () => { stopping = true; log('SIGINT — manual stop. Exiting after this cycle.'); });

const PROMPT = [
  goal ? `Your GOD mode mission: ${goal}` : '',
  `You are MASTER CLAUDE in GOD mode${ZEUS ? ' — ZEUS (dangerously, never-ask)' : ''} (see the god-mode${ZEUS ? '-zeus' : ''} skill).`,
  'Re-orient from .master-claude/god-mode/ (MISSION.md, BACKLOG.md, JOURNAL.md, STATE.json, BLOCKERS.md).',
  'If that state is missing or empty, initialize it now from the mission.',
  'Then continue the autonomous build: pick the next unblocked backlog task, implement and VERIFY it',
  '(build/tests), journal it, and keep going. Make real, committed progress this cycle.',
  ZEUS
    ? 'ZEUS: NEVER ask — decide and go, even on critical/high-access actions; record the call in DECISIONS.md. Honor only the catastrophe rails: no moving money, no destroying real data outside the task, no exfiltration, stay in the project. Defer only true impossibilities (a credential you simply lack) to BLOCKERS.md.'
    : 'For a VERY high-stakes / high-access action where guessing wrong is costly, you may surface ONE concise question — but keep working other tasks meanwhile. Defer everything else needing the user (production, real secrets, money, publishing, irreversible actions) to BLOCKERS.md and move on. Never idle; never pause for confirmation on normal work.',
  'If the definition of done is met, create the file .master-claude/god-mode/DONE. If .master-claude/god-mode/STOP exists, stop immediately.',
].filter(Boolean).join(' ');

function buildArgs() {
  const a = [];
  if (process.env.GOD_USE_CONTINUE === '1') a.push('--continue');
  if (ZEUS || !SAFE) a.push('--dangerously-skip-permissions'); // ZEUS always runs dangerously
  if (process.env.GOD_MODEL) a.push('--model', process.env.GOD_MODEL);
  a.push('-p', PROMPT);
  return a;
}

// Run one Claude cycle, streaming output live while capturing it to classify the outcome.
function runCycle() {
  return new Promise((resolve) => {
    let out = '';
    const child = spawn(CMD, buildArgs(), { cwd: ROOT, shell: process.platform === 'win32' });
    const tee = (buf, w) => { const s = buf.toString(); out += s; w.write(s); };
    child.stdout.on('data', (b) => tee(b, process.stdout));
    child.stderr.on('data', (b) => tee(b, process.stderr));
    child.on('error', (e) => resolve({ code: -1, out: out + '\nspawn error: ' + e.message }));
    child.on('close', (code) => resolve({ code, out }));
  });
}

const LIMIT_RE = /usage limit|rate.?limit|limit reached|quota|429|too many requests|overloaded|insufficient (?:credit|quota|tokens)|capacity|billing|exceeded your/i;
// Try to read an explicit wait hint from the CLI's message; fall back to exponential backoff.
function parseWaitMs(text) {
  let m = text.match(/(?:try again|retry|resets?|available) in\s+(\d+)\s*(second|minute|hour)s?/i);
  if (m) { const n = +m[1]; const u = m[2].toLowerCase(); return n * (u[0] === 'h' ? 3600 : u[0] === 'm' ? 60 : 1) * 1000; }
  m = text.match(/retry[- ]after[:\s]+(\d+)/i);
  if (m) return +m[1] * 1000;
  return 0;
}

async function main() {
  log(`GOD mode runner up${ZEUS ? ' — ZEUS (dangerously, never-ask)' : ''}. cmd="${CMD}" ${(ZEUS || !SAFE) ? '(autonomous)' : '(SAFE: permissions ON)'} ${goal ? '| goal: ' + goal : ''}`);
  if (ZEUS) log('ZEUS: no asking, no permission prompts. Catastrophe rails still hold (no money, no destroying real data, no exfiltration, stay in project). Ctrl-C or touch STOP to halt.');
  else if (!SAFE) log('Running Claude unattended (--dangerously-skip-permissions). The god-mode safety rails apply. Ctrl-C or touch STOP to stop.');
  let cycle = 0, limitBackoff = 60_000, errBackoff = 30_000, fails = 0;

  while (!stopping) {
    if (fs.existsSync(STOP)) { log('STOP file present — manual stop. Done.'); break; }
    if (fs.existsSync(DONE)) { log('DONE file present — mission complete. Done.'); break; }
    if (MAX_CYCLES && cycle >= MAX_CYCLES) { log(`Reached GOD_MAX_CYCLES=${MAX_CYCLES}. Done.`); break; }

    cycle++;
    log(`--- cycle ${cycle} ---`);
    const { code, out } = await runCycle();

    if (stopping || fs.existsSync(STOP)) { log('Stop requested — exiting.'); break; }
    if (fs.existsSync(DONE)) { log('Mission marked DONE — exiting.'); break; }

    if (LIMIT_RE.test(out)) {
      const hinted = parseWaitMs(out);
      const wait = Math.min(hinted || limitBackoff, MAX_BACKOFF);
      if (!hinted) limitBackoff = Math.min(limitBackoff * 2, MAX_BACKOFF); // grow only when we're guessing
      log(`Usage limit hit. Pausing ${Math.round(wait / 1000)}s, then auto-resuming…`);
      await sleep(wait);
      continue;
    }

    if (code === 0) {
      fails = 0; limitBackoff = 60_000; errBackoff = 30_000;
      log('Cycle complete. Continuing.');
      await sleep(4000);
      continue;
    }

    // crashed / errored (not a limit): never give up — back off and retry.
    fails++;
    const wait = Math.min(errBackoff, MAX_BACKOFF);
    errBackoff = Math.min(errBackoff * 2, MAX_BACKOFF);
    log(`Cycle exited ${code} (failure #${fails}). Backing off ${Math.round(wait / 1000)}s, then retrying.`);
    if (fails === 5) log('NOTE: 5 consecutive failures — check runner.log / the project. Still retrying (only STOP halts me).');
    await sleep(wait);
  }
  log('GOD mode runner stopped.');
}

main().catch((e) => { log('runner fatal: ' + (e && e.stack || e)); process.exit(1); });
