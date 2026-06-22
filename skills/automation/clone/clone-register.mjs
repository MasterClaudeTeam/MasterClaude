#!/usr/bin/env node
// clone-register.mjs — register the clone bridge as a background daemon that starts on boot and
// stays up (so the clone is immortal across reboots). Generalizes the `scheduling` skill.
//
// Default prints the PLAN (no system change). Apply only with an explicit flag:
//   node clone-register.mjs            show the plan for this OS (safe; changes nothing)
//   node clone-register.mjs --install  write the launcher + register the OS task(s)
//   node clone-register.mjs --status   is it registered / running?
//   node clone-register.mjs --remove   unregister
//
// Windows → schtasks (ONLOGON + 1-min watchdog). Linux → cron @reboot + watchdog. macOS → launchd KeepAlive.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DIR = path.join(ROOT, '.clone');
fs.mkdirSync(DIR, { recursive: true });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.join(HERE, 'clone-runner.mjs');
const NODE = process.execPath;
const LOGP = path.join(DIR, 'runner.log');
const REG = path.join(DIR, 'registry.md');
const PLAT = process.platform;
const sh = (c) => execFileSync(PLAT === 'win32' ? 'cmd' : '/bin/sh', [PLAT === 'win32' ? '/c' : '-c', c], { encoding: 'utf8' });

function planWindows() {
  const cmd = path.join(DIR, 'clone.cmd');
  return {
    launcher: { path: cmd, content: `@echo off\r\ncd /d "${ROOT}"\r\n"${NODE}" "${RUNNER}" >> "${LOGP}" 2>&1\r\n` },
    commands: [
      `schtasks /Create /TN "MasterClaudeClone\\boot" /TR "\\"${cmd}\\"" /SC ONLOGON /F`,
      `schtasks /Create /TN "MasterClaudeClone\\watchdog" /TR "\\"${cmd}\\"" /SC MINUTE /MO 1 /F`,
    ],
    remove: [`schtasks /Delete /TN "MasterClaudeClone\\boot" /F`, `schtasks /Delete /TN "MasterClaudeClone\\watchdog" /F`],
    status: `schtasks /Query /TN "MasterClaudeClone\\boot"`,
    note: 'Windows: launcher .cmd + ONLOGON task + a 1-min watchdog (schtasks has no native keep-alive).',
  };
}
function planCron() {
  const s = path.join(DIR, 'clone.sh');
  const line = `@reboot ${s}`, watch = `* * * * * pgrep -f clone-runner.mjs >/dev/null || ${s}`;
  return {
    launcher: { path: s, content: `#!/usr/bin/env bash\ncd "${ROOT}" || exit 1\nexec "${NODE}" "${RUNNER}" >> "${LOGP}" 2>&1\n`, chmod: true },
    commands: [`(crontab -l 2>/dev/null | grep -v clone-runner.mjs; echo "${line}"; echo "${watch}") | crontab -`],
    remove: [`crontab -l 2>/dev/null | grep -v clone-runner.mjs | crontab -`],
    status: `crontab -l 2>/dev/null | grep clone-runner.mjs || echo "(not registered)"`,
    note: 'Linux: cron @reboot + a 1-min watchdog. (A systemd --user unit with Restart=always is cleaner where available.)',
  };
}
function planLaunchd() {
  const plist = path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.masterclaude.clone.plist');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.masterclaude.clone</string>
  <key>ProgramArguments</key><array><string>${NODE}</string><string>${RUNNER}</string></array>
  <key>WorkingDirectory</key><string>${ROOT}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${LOGP}</string>
  <key>StandardErrorPath</key><string>${LOGP}</string>
</dict></plist>
`;
  return {
    launcher: { path: plist, content: xml },
    commands: [`launchctl unload "${plist}" 2>/dev/null; launchctl load "${plist}"`],
    remove: [`launchctl unload "${plist}" 2>/dev/null; rm -f "${plist}"`],
    status: `launchctl list | grep com.masterclaude.clone || echo "(not loaded)"`,
    note: 'macOS: launchd RunAtLoad + KeepAlive — launchd itself restarts it; no watchdog needed.',
  };
}
const plan = PLAT === 'win32' ? planWindows() : PLAT === 'darwin' ? planLaunchd() : planCron();
const mode = process.argv[2] || 'plan';

function showPlan() {
  console.log(`Clone daemon — plan for ${PLAT}\n${plan.note}\n`);
  console.log(`Launcher → ${plan.launcher.path}`);
  console.log('Will run:'); plan.commands.forEach((c) => console.log('  ' + c));
  console.log('\nApply with  --install  · check with  --status  · undo with  --remove');
}

if (mode === '--install') {
  fs.writeFileSync(plan.launcher.path, plan.launcher.content);
  if (plan.launcher.chmod) fs.chmodSync(plan.launcher.path, 0o755);
  for (const c of plan.commands) sh(c);
  fs.appendFileSync(REG, `- ${new Date().toISOString()} installed clone daemon (${PLAT})\n`);
  console.log('Installed. The clone will start on boot and stay up. Logs → ' + LOGP);
} else if (mode === '--remove') {
  for (const c of plan.remove) { try { sh(c); } catch {} }
  fs.appendFileSync(REG, `- ${new Date().toISOString()} removed clone daemon (${PLAT})\n`);
  console.log('Removed.');
} else if (mode === '--status') {
  try { console.log(sh(plan.status).trim()); } catch { console.log('(not registered)'); }
} else showPlan();
