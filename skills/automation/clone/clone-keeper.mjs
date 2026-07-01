#!/usr/bin/env node
// clone-keeper.mjs — a tiny, dependency-free WATCHDOG for the clone. It keeps clone-runner.mjs alive: if the
// runner dies (crash, kill, OOM), the keeper relaunches it (detached). The runner in turn relaunches the keeper
// if IT dies (see ensureKeeper in clone-runner.mjs) — so the two revive each other and the clone never fully
// dies while the system is on. A `.clone/STOP` file pauses BOTH (intentional shutdown). Single-instance via
// keeper.lock. Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, 'clone-runner.mjs');
const ROOT = process.cwd();
const DIR = path.join(ROOT, '.clone');
fs.mkdirSync(DIR, { recursive: true });
const LOCK = path.join(DIR, 'clone.lock');     // the runner's lock
const KLOCK = path.join(DIR, 'keeper.lock');   // our own lock
const STOP = path.join(DIR, 'STOP');
const LOG = path.join(DIR, 'keeper.log');

const stamp = () => new Date().toISOString();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function klog(m) { try { fs.appendFileSync(LOG, `[${stamp()}] ${m}\n`); } catch {} }
function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } }
function isAlive(pid) { if (!pid) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } }

// single keeper instance — if another keeper is alive, exit
{ const k = readJson(KLOCK); if (k.pid && isAlive(k.pid)) process.exit(0); try { fs.writeFileSync(KLOCK, JSON.stringify({ pid: process.pid, at: stamp() })); } catch {} }
process.on('exit', () => { try { if (readJson(KLOCK).pid === process.pid) fs.rmSync(KLOCK, { force: true }); } catch {} });

function runnerAlive() { return isAlive(readJson(LOCK).pid); }
function launchRunner() {
  klog('runner is down — relaunching it (detached)');
  try { const c = spawn(process.execPath, [RUNNER], { cwd: ROOT, detached: true, stdio: 'ignore', windowsHide: true }); c.unref(); }
  catch (e) { klog('relaunch failed: ' + e.message); }
}

klog(`keeper up (pid ${process.pid})`);
(async () => {
  while (true) {
    try {
      if (fs.existsSync(STOP)) { await sleep(15000); continue; }   // intentional shutdown — don't fight it
      if (!runnerAlive()) { launchRunner(); await sleep(12000); }  // give it time to take the lock
    } catch (e) { klog('loop error: ' + e.message); }
    await sleep(20000);
  }
})();
