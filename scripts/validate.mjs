#!/usr/bin/env node
// Validate the MASTER CLAUDE plugin: every manifest parses, every skill/agent has valid frontmatter
// (name + description), and at least one skill exists. Exit non-zero on any problem (used in CI).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const problems = [];
const need = (cond, msg) => { if (!cond) problems.push(msg); };

for (const f of ['.claude-plugin/plugin.json', '.claude-plugin/marketplace.json', 'hooks/hooks.json']) {
  try { JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8')); }
  catch (e) { problems.push(`BAD JSON ${f}: ${e.message}`); }
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
need(skills.length > 0, 'no skills found under skills/');
for (const f of [...skills, ...agents]) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const fm = frontmatter(f);
  need(fm, `no frontmatter: ${rel}`);
  if (fm) { need(fm.name, `no \`name\`: ${rel}`); need(fm.desc, `no \`description\`: ${rel}`); }
}

if (problems.length) {
  console.error('✗ validation FAILED:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`✓ valid: ${skills.length} skills, ${agents.length} agents, manifests OK`);
