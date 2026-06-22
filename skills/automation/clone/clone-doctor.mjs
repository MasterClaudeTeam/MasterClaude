#!/usr/bin/env node
// clone-doctor.mjs — preflight / health checks for the clone. READ-ONLY. Exits non-zero on any failure.
// Run before first launch (and via Telegram `/health`). Verifies the host can actually run the clone.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as tg from './clone-telegram.mjs';

const ROOT = process.cwd();
loadEnv(path.join(ROOT, '.env'));
const checks = [];
const ok = (name, msg) => checks.push({ name, ok: true, msg });
const bad = (name, msg) => checks.push({ name, ok: false, msg });
function loadEnv(p) { try { for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch {} }
function gitIgnored(p) { try { execFileSync('git', ['check-ignore', p], { cwd: ROOT, encoding: 'utf8' }); return true; } catch { return false; } }

async function main() {
  // Node
  const major = +process.versions.node.split('.')[0];
  major >= 18 ? ok('node', `v${process.versions.node}`) : bad('node', `need >= 18, have ${process.versions.node}`);

  // claude CLI present + runnable
  try {
    const v = execFileSync(process.env.CLONE_CLAUDE_CMD || 'claude', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' }).trim();
    ok('claude', v.split('\n')[0]);
  } catch { bad('claude', 'not found — install Claude Code and log in (`claude --version` must work)'); }

  // Telegram token + reachability
  if (!process.env.TELEGRAM_BOT_TOKEN) bad('token', 'TELEGRAM_BOT_TOKEN not set (put it in a gitignored .env)');
  else {
    const via = process.env.TELEGRAM_API_BASE ? ` via bridge ${process.env.TELEGRAM_API_BASE}` : '';
    try { const me = await tg.getMe(); ok('telegram', `@${me.username}${via}`); }
    catch (e) { bad('telegram', `getMe failed${via}: ` + e.message); }
  }

  // owner allowlist
  process.env.CLONE_OWNER_CHAT_ID ? ok('owner', process.env.CLONE_OWNER_CHAT_ID)
    : bad('owner', 'CLONE_OWNER_CHAT_ID unset — first /start pairs; set it after to lock the bot to you');

  // secrets never committed
  gitIgnored('.env') ? ok('gitignore .env', 'ignored') : bad('gitignore .env', 'add `.env` to .gitignore (the token must never be committed)');
  gitIgnored('.clone/') ? ok('gitignore .clone', 'ignored') : bad('gitignore .clone', 'add `.clone/` to .gitignore');

  // brain repo reachable over SSH
  const ssh = process.env.CLONE_REPO_SSH;
  if (!ssh) bad('brain repo', 'CLONE_REPO_SSH unset — create a PRIVATE repo `clone` and add its SSH url');
  else { try { execFileSync('git', ['ls-remote', ssh], { encoding: 'utf8', timeout: 20000 }); ok('brain repo', 'reachable'); } catch (e) { bad('brain repo', 'git ls-remote failed: ' + String(e.stderr || e.message).split('\n')[0]); } }

  // single instance
  const lock = path.join(ROOT, '.clone', 'clone.lock');
  if (fs.existsSync(lock)) {
    let pid = 0; try { pid = JSON.parse(fs.readFileSync(lock, 'utf8')).pid; } catch {}
    let alive = false; try { process.kill(pid, 0); alive = true; } catch (e) { alive = e.code === 'EPERM'; }
    alive ? bad('single-instance', `already running (pid ${pid}) — stop it first`) : ok('single-instance', 'stale lock (fine)');
  } else ok('single-instance', 'no lock');

  let pass = true;
  console.log('clone-doctor — host readiness\n');
  for (const c of checks) { console.log(`  ${c.ok ? ' ok ' : 'FAIL'}  ${c.name.padEnd(16)} ${c.msg}`); if (!c.ok) pass = false; }
  console.log(pass ? '\nAll clear — the clone can run here.' : '\nFix the FAIL lines above, then re-run.');
  process.exit(pass ? 0 : 1);
}
main();
