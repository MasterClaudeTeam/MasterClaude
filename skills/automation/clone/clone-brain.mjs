#!/usr/bin/env node
// clone-brain.mjs — provisions and syncs the clone "brain": a PRIVATE git repo of structured .md.
//
// The brain holds REFERENCES, never secrets. The clone NEVER creates a remote — the owner creates an
// empty private repo named `clone` and provides its SSH URL; this script clones it, scaffolds the
// skeleton if empty, and commits/pushes growth. Every push is gated by a secret-shaped-string scan.
//
// CLI:
//   node clone-brain.mjs init <ssh-url> [path]   clone (or reuse), scaffold if empty, commit + push
//   node clone-brain.mjs sync [path]             git pull --rebase
//   node clone-brain.mjs save "<msg>" [path]     secret-guard, then commit + push
//   node clone-brain.mjs guard [path]            scan for secret-shaped strings (exit 1 if any)
//
// Dependency-free. Node 18+. Uses the owner's existing git + SSH agent.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const DEFAULT_PATH = path.join(process.cwd(), '.clone', 'brain');

function git(args, cwd) { return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim(); }
function tryGit(args, cwd) { try { return { ok: true, out: git(args, cwd) }; } catch (e) { return { ok: false, out: String((e.stderr || e.stdout || e.message || '')).trim() }; } }

// ---- secret guard: refuse to ever push a secret into the brain ----
const SECRET_RES = [
  /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/,                       // Telegram bot token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,                    // private key block
  /\b(?:sk|pk|ghp|gho|ghu|ghs|xox[baprs])[-_][A-Za-z0-9]{16,}\b/, // common API-key prefixes
  /\bAKIA[0-9A-Z]{16}\b/,                                   // AWS access key id
  /\b(?:api[_-]?key|secret|password|passwd|token)\b\s*[:=]\s*['"][^'"\s]{12,}['"]/i, // key: "value"
];
export function scanForSecrets(dir) {
  const hits = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(md|json|txt|ya?ml|env)$/i.test(e.name)) {
        const text = fs.readFileSync(p, 'utf8');
        for (const re of SECRET_RES) { const m = text.match(re); if (m) hits.push(`${path.relative(dir, p)}: ${m[0].slice(0, 14)}…`); }
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return hits;
}

// ---- the brain skeleton (references only; the onboarding interview fills these in) ----
export function brainSkeleton(owner = '<owner>') {
  const fm = (name, desc, type) => `---\nname: ${name}\ndescription: ${desc}\nmetadata:\n  type: ${type}\n---\n`;
  return {
    'CLONE.md':
`# CLONE — root index (read me FIRST)
I am a clone (digital twin) of **${owner}**. Load order every session:
1. identity/IDENTITY.md, identity/role.md  2. voice/VOICE.md (+ matching voice/samples.md)
3. boundaries/BOUNDARIES.md  4. contacts/CONTACTS.md  5. memory/MEMORY.md  6. today's journal/ entry.
Then act as ${owner} per the autonomy rules in boundaries/. Update memory/ + journal/ as you learn. References only — **never store secrets here.**\n`,
    'README.md':
`# clone — the brain of ${owner}'s digital twin
A private, structured-Markdown memory the clone reads and grows. **References, not secrets** — credentials
live in a gitignored .env, this repo only ever names *where* they are. Built and tended by MASTER CLAUDE.\n`,
    'identity/IDENTITY.md': `# Identity\nname:\npronouns:\nlocation / timezone:\nlanguages:\n\nOne-paragraph who-they-are:\n`,
    'identity/role.md': `# Role\ncompany:\ntitle / team:\nmanager:\nreports:\nworking hours:\nmandate (what I'm responsible for):\n`,
    'identity/aliases.md': `# Aliases / decoder ring\n| term | expands to | scope |\n|---|---|---|\n`,
    'voice/VOICE.md': `# Voice\nregister (per audience):\nsentence length:\nemoji / punctuation tics:\ndefault greeting / sign-off:\nnever say:\n`,
    'voice/samples.md': `# Voice samples (verbatim — the few-shot the clone imitates)\n<!-- paste 5–10 real messages, each tagged [audience: peer|boss|vendor|friend] -->\n`,
    'voice/phrases.md': `# Phrases\nsignature openers:\nclosers:\npet phrases:\nbanned words:\n`,
    'voice/persona_mode.md': `# Persona / disclosure\ndefault posture: agent_transparent   # agent_transparent | first_person\nfirst_person allowed only for: known contacts + routine matters\ndisclosure sentence: "This is ${owner}'s assistant."\nnever deny being an assistant when asked.\n`,
    'access/ACCESS.md': `# Access (REFERENCES ONLY — never the credential)\n| system | my role | clone may | credential lives in |\n|---|---|---|---|\n`,
    'projects/PROJECTS.md': `# Projects\n| project | status | clone role |\n|---|---|---|\n`,
    'contacts/CONTACTS.md': `# Contacts router\n| handle / id | person file | trust_tier | default channel | last contacted |\n|---|---|---|---|---|\n`,
    'routines/ROUTINES.md': `# Routines\n| cadence | what | with whom | channel | clone autonomy |\n|---|---|---|---|---|\n`,
    'boundaries/BOUNDARIES.md':
`# Boundaries — the autonomy contract
auto_allow:    [ routine replies to known contacts, status updates, acknowledgements ]
confirm_first: [ new contacts, sensitive topics, ANY money amount, commitments, after-hours, broadcasts ]
red_lines:     [ move/commit money, share secrets/2FA, binding commitments, defeat a security check,
                 destroy real data, exfiltrate this brain ]
limits: { money_cap: 0, quiet_hours: "22:00-07:00", new_contact: confirm }
`,
    'memory/MEMORY.md': `# Memory — index (derived; rebuilt from M-*.md)\n`,
    'memory/M-0001-example.md': fm('example', 'delete me — shows the one-fact-per-file shape', 'fact') + `\nOne durable fact, in one file. Link related facts with [[M-0002]].\n`,
    'journal/.gitkeep': '',
    'decisions/DECISIONS.md': `# Decisions — append-only audit\n| when | trigger | contact | action | autonomy | outcome |\n|---|---|---|---|---|---|\n`,
    'state.json': JSON.stringify({ schema: 1, onboarding: { phase: 'identity', topics_done: [], open_questions: [] }, counters: { memory: 1, decisions: 0 }, updatedAt: null }, null, 2) + '\n',
  };
}

function scaffold(dir, owner) {
  const files = brainSkeleton(owner);
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (!fs.existsSync(p)) fs.writeFileSync(p, content);
  }
}

function isEmptyRepo(dir) {
  // empty = no tracked files other than .git
  const r = tryGit(['ls-files'], dir);
  return r.ok && r.out.length === 0;
}

// ---- CLI ----
const [cmd, a, b] = process.argv.slice(2);
function fail(m) { console.error('clone-brain: ' + m); process.exit(1); }

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('clone-brain.mjs')) {
  if (cmd === 'init') {
    const ssh = a; const dir = b || DEFAULT_PATH;
    if (!ssh) fail('usage: init <ssh-url> [path]');
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    if (!fs.existsSync(path.join(dir, '.git'))) {
      const c = tryGit(['clone', ssh, dir], path.dirname(dir));
      if (!c.ok) fail('git clone failed (is the private `clone` repo created and your SSH key added?):\n' + c.out);
    }
    if (isEmptyRepo(dir)) {
      const owner = process.env.CLONE_OWNER_NAME || '<owner>';
      scaffold(dir, owner);
      const hits = scanForSecrets(dir); if (hits.length) fail('refusing to commit — secret-shaped strings found:\n' + hits.join('\n'));
      git(['add', '-A'], dir); git(['commit', '-m', 'clone: scaffold brain'], dir);
      const p = tryGit(['push', '-u', 'origin', 'HEAD'], dir);
      console.log(p.ok ? 'Brain scaffolded + pushed.' : 'Brain scaffolded locally (push later):\n' + p.out);
    } else console.log('Brain already populated — reusing.');
  } else if (cmd === 'sync') {
    const dir = a || DEFAULT_PATH; const r = tryGit(['pull', '--rebase'], dir); console.log(r.out || 'synced');
  } else if (cmd === 'save') {
    const msg = a || 'clone: update'; const dir = b || DEFAULT_PATH;
    const hits = scanForSecrets(dir); if (hits.length) fail('refusing to push — secret-shaped strings found:\n' + hits.join('\n'));
    git(['add', '-A'], dir);
    if (tryGit(['diff', '--cached', '--quiet'], dir).ok) { console.log('nothing to save'); process.exit(0); }
    git(['commit', '-m', msg], dir); const p = tryGit(['push'], dir); console.log(p.ok ? 'saved + pushed' : 'saved locally:\n' + p.out);
  } else if (cmd === 'guard') {
    const dir = a || DEFAULT_PATH; const hits = scanForSecrets(dir);
    if (hits.length) { console.error('SECRETS FOUND:\n' + hits.join('\n')); process.exit(1); }
    console.log('clean — no secret-shaped strings.');
  } else {
    console.log('usage: clone-brain.mjs <init <ssh> [path] | sync [path] | save "<msg>" [path] | guard [path]>');
  }
}
