#!/usr/bin/env node
// clone-vault.mjs — encrypt the clone's SENSITIVE memory at rest so it can live in the (private) brain repo
// yet stay unreadable without your key. Portable: clone the repo on a new machine, set the same
// CLONE_VAULT_PASSPHRASE, run `open`, and the clone remembers everything again.
//
//   node clone-vault.mjs seal [plain-dir] [enc-file]   encrypt plain-dir  -> enc-file (commit the enc-file)
//   node clone-vault.mjs open [enc-file] [plain-dir]    decrypt enc-file   -> plain-dir (gitignored, runtime)
//   node clone-vault.mjs status [plain-dir] [enc-file]
//
// Layout (defaults): plaintext lives ONLY in the gitignored .clone/vault/ (runtime); the encrypted blob is
// committed inside the brain repo at .clone/brain/vault/vault.enc. So GitHub only ever holds ciphertext.
//
// Crypto: AES-256-GCM; key = scrypt(passphrase, random salt). The passphrase comes from
// CLONE_VAULT_PASSPHRASE (gitignored .env) — YOU choose it, it never enters the repo and is never printed.
// Lose it and the vault is unrecoverable (by design). Dependency-free (node:crypto). Node 18+.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const DEF_PLAIN = path.join(ROOT, '.clone', 'vault');                          // gitignored plaintext
const DEF_ENC = path.join(ROOT, '.clone', 'brain', 'vault', 'vault.enc');       // committed ciphertext
loadEnv(path.join(ROOT, '.env'));

function loadEnv(p) {
  try { for (const l of fs.readFileSync(p, 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch {}
}
function passphrase() {
  const p = process.env.CLONE_VAULT_PASSPHRASE;
  if (!p) { console.error('CLONE_VAULT_PASSPHRASE not set — put your vault key in the gitignored .env.'); process.exit(1); }
  return p;
}
const keyFrom = (pass, salt) => crypto.scryptSync(pass, salt, 32);

function packDir(dir) {
  const files = {};
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else files[path.relative(dir, p).split(path.sep).join('/')] = fs.readFileSync(p).toString('base64');
    }
  };
  walk(dir);
  return files;
}

function seal(plainDir, encFile) {
  const files = packDir(plainDir);
  if (!Object.keys(files).length) { console.error(`nothing to seal in ${plainDir}`); process.exit(1); }
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), key = keyFrom(passphrase(), salt);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(Buffer.from(JSON.stringify(files), 'utf8')), c.final()]);
  fs.mkdirSync(path.dirname(encFile), { recursive: true });
  fs.writeFileSync(encFile, JSON.stringify({
    v: 1, kdf: 'scrypt', cipher: 'aes-256-gcm', files: Object.keys(files).length,
    salt: salt.toString('base64'), iv: iv.toString('base64'),
    tag: c.getAuthTag().toString('base64'), data: enc.toString('base64'),
  }, null, 2) + '\n');
  console.log(`sealed ${Object.keys(files).length} file(s) -> ${path.relative(ROOT, encFile)}`);
}

function open(encFile, plainDir) {
  if (!fs.existsSync(encFile)) { console.error(`no vault at ${encFile}`); process.exit(1); }
  const o = JSON.parse(fs.readFileSync(encFile, 'utf8'));
  const d = crypto.createDecipheriv('aes-256-gcm', keyFrom(passphrase(), Buffer.from(o.salt, 'base64')), Buffer.from(o.iv, 'base64'));
  d.setAuthTag(Buffer.from(o.tag, 'base64'));
  let plain;
  try { plain = Buffer.concat([d.update(Buffer.from(o.data, 'base64')), d.final()]); }
  catch { console.error('decrypt FAILED — wrong CLONE_VAULT_PASSPHRASE or corrupted vault.'); process.exit(1); }
  const files = JSON.parse(plain.toString('utf8'));
  for (const [rel, b64] of Object.entries(files)) {
    const p = path.join(plainDir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, Buffer.from(b64, 'base64'));
  }
  console.log(`opened ${Object.keys(files).length} file(s) -> ${path.relative(ROOT, plainDir)}`);
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'seal') seal(a || DEF_PLAIN, b || DEF_ENC);
else if (cmd === 'open') open(a || DEF_ENC, b || DEF_PLAIN);
else if (cmd === 'status') {
  console.log('plaintext dir :', fs.existsSync(a || DEF_PLAIN) ? 'present (gitignored)' : 'absent');
  console.log('encrypted blob:', fs.existsSync(b || DEF_ENC) ? 'present (committed)' : 'absent');
  console.log('passphrase set:', !!process.env.CLONE_VAULT_PASSPHRASE);
} else console.log('usage: clone-vault.mjs <seal [plain] [enc] | open [enc] [plain] | status>');
