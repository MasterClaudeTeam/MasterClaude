#!/usr/bin/env node
// Validate the MASTER CLAUDE skills repo: every skill/agent/command has valid frontmatter
// (skills & agents need name + description; commands need description), the key docs exist,
// and at least one skill is present. There is NO plugin manifest — MASTER CLAUDE is plain
// markdown you copy into .claude/. Exit non-zero on any problem (used in CI).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const problems = [];
const need = (cond, msg) => { if (!cond) problems.push(msg); };

// the repo must ship the setup docs so "give Claude Code the link" works
for (const f of ['README.md', 'SETUP.md', 'LICENSE']) {
  need(fs.existsSync(path.join(ROOT, f)), `missing ${f}`);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
function frontmatter(file) {
  const s = fs.readFileSync(file, 'utf8');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return { name: (/^name:\s*(.+)$/m.exec(m[1]) || [])[1]?.trim(), desc: /(^|\n)description:/.test(m[1]) };
}

const skills = walk(path.join(ROOT, 'skills')).filter((p) => p.endsWith('SKILL.md'));
const agents = walk(path.join(ROOT, 'agents')).filter((p) => p.endsWith('.md'));
const commands = walk(path.join(ROOT, 'commands')).filter((p) => p.endsWith('.md'));
need(skills.length > 0, 'no skills found under skills/');

// skills & agents: need name + description
for (const f of [...skills, ...agents]) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const fm = frontmatter(f);
  need(fm, `no frontmatter: ${rel}`);
  if (fm) { need(fm.name, `no \`name\`: ${rel}`); need(fm.desc, `no \`description\`: ${rel}`); }
}
// commands: a description is enough (the name comes from the file path)
for (const f of commands) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const fm = frontmatter(f);
  need(fm && fm.desc, `command needs frontmatter \`description\`: ${rel}`);
}

if (problems.length) {
  console.error('✗ validation FAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`✓ valid: ${skills.length} skills, ${agents.length} agents, ${commands.length} commands`);
