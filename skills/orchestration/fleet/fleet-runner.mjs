#!/usr/bin/env node
// fleet-runner.mjs — MASTER CLAUDE fleet: fan out INDEPENDENT analysis tasks to parallel `claude -p` worker
// sessions, collect each result on a filesystem job board, and merge them.
//
// Workers ANALYZE and report — this runner does NOT edit your source, so there's no parallel-edit merge risk.
// For parallel EDITS, use Claude Code background sessions (`claude --bg`) / worktrees instead (see the fleet skill).
//
// Usage:
//   node fleet-runner.mjs tasks.json          # tasks.json: ["task one","task two"]  OR  [{ "id","prompt" }]
//   node fleet-runner.mjs --task "review A" --task "review B"
// Flags:
//   --concurrency N   how many run at once   (default 3 — keep it small; N parallel ≈ N× usage)
//   --budget N        per-worker --max-budget-usd cap (omit to leave uncapped)
//   --model M         pass --model to each worker
//   --dry-run         don't spawn claude; just record the planned tasks
// Output:
//   .mc/fleet/<runId>/<id>.json (per worker) + results.json (merged) + fleet.log   ·   stop: touch .mc/fleet/STOP
//
// N parallel workers ≈ N× usage. Opt-in: YOU launch it; nothing auto-fans-out. Dependency-free, Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv.slice(2);
const flag = (name, def) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const has = (name) => argv.includes(name);

const ROOT = process.cwd();
const CMD = process.env.FLEET_CLAUDE_CMD || 'claude';
const CONC = Math.max(1, Number(flag('--concurrency', '3')));
const BUDGET = flag('--budget', '');
const MODEL = flag('--model', '');
const DRY = has('--dry-run');

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const BASE = path.join(ROOT, '.mc', 'fleet');
const DIR = path.join(BASE, runId);
const STOP = path.join(BASE, 'STOP');
fs.mkdirSync(DIR, { recursive: true });
const LOG = path.join(DIR, 'fleet.log');
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); try { fs.appendFileSync(LOG, l + '\n'); } catch {} };

function loadTasks() {
  const tasks = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === '--task' && argv[i + 1]) tasks.push(argv[++i]);
  if (tasks.length) return tasks.map((p, i) => ({ id: String(i + 1), prompt: p }));
  const file = argv.find((a) => !a.startsWith('--') && fs.existsSync(a));
  if (!file) { console.error('usage: fleet-runner.mjs <tasks.json> | --task "..." [--task "..."]   (see --help in the header)'); process.exit(1); }
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(raw)) { console.error('tasks file must be a JSON array of strings or {id,prompt} objects'); process.exit(1); }
  return raw.map((t, i) => (typeof t === 'string' ? { id: String(i + 1), prompt: t } : { id: String(t.id || i + 1), prompt: t.prompt }));
}

const PREAMBLE =
  'You are a MASTER CLAUDE fleet worker handling ONE independent task. Do the analysis/work and end with a concise, self-contained result. ' +
  'Safety rails hold: never move money, destroy real data, exfiltrate, or roam outside the project. This is a read/analysis pass — report findings; do not make sweeping source edits unless the task explicitly asks for a specific change.';

function runWorker(task) {
  return new Promise((resolve) => {
    const out = path.join(DIR, `${task.id}.json`);
    if (DRY) { fs.writeFileSync(out, JSON.stringify({ id: task.id, dryRun: true, prompt: task.prompt }, null, 2)); log(`worker ${task.id} [dry-run]`); resolve(); return; }
    const a = ['-p', '--output-format', 'json', '--dangerously-skip-permissions'];
    if (MODEL) a.push('--model', MODEL);
    if (BUDGET) a.push('--max-budget-usd', BUDGET);
    a.push(`${PREAMBLE}\n\nTASK: ${task.prompt}`);
    let buf = '';
    const child = spawn(CMD, a, { cwd: ROOT, shell: process.platform === 'win32' });
    child.stdout.on('data', (b) => (buf += b));
    child.stderr.on('data', (b) => (buf += b));
    child.on('error', (e) => { fs.writeFileSync(out, JSON.stringify({ id: task.id, prompt: task.prompt, error: e.message }, null, 2)); log(`worker ${task.id} spawn error: ${e.message}`); resolve(); });
    child.on('close', (code) => {
      let result; try { result = JSON.parse(buf); } catch { result = { raw: buf.slice(-6000) }; }
      fs.writeFileSync(out, JSON.stringify({ id: task.id, prompt: task.prompt, code, result }, null, 2));
      log(`worker ${task.id} done (exit ${code})`);
      resolve();
    });
  });
}

// simple fixed-size worker pool
async function pool(tasks, n) {
  let i = 0;
  const worker = async () => {
    while (i < tasks.length) {
      if (fs.existsSync(STOP)) { log('STOP present — not dispatching more.'); return; }
      await runWorker(tasks[i++]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
}

(async () => {
  const tasks = loadTasks();
  if (fs.existsSync(STOP)) fs.rmSync(STOP, { force: true });
  log(`fleet up — ${tasks.length} task(s), concurrency ${CONC}${BUDGET ? `, budget $${BUDGET}/worker` : ''}${DRY ? ' [DRY-RUN]' : ''}`);
  log(`Cost: ~${CONC}x usage while running. Workers analyze + report (no source edits). touch .mc/fleet/STOP to halt.`);
  await pool(tasks, CONC);
  const merged = tasks.map((t) => { try { return JSON.parse(fs.readFileSync(path.join(DIR, `${t.id}.json`), 'utf8')); } catch { return { id: t.id, prompt: t.prompt, missing: true }; } });
  fs.writeFileSync(path.join(DIR, 'results.json'), JSON.stringify(merged, null, 2));
  log(`done — ${merged.length} result(s) -> ${path.relative(ROOT, path.join(DIR, 'results.json'))}`);
})().catch((e) => { log('fatal: ' + (e && e.stack || e)); process.exit(1); });
