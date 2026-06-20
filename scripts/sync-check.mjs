#!/usr/bin/env node
// Maintainer tool: flag skills present in this plugin repo but missing from the (private) website catalog,
// and vice-versa, so the showcase site never drifts from the plugin. Skips gracefully if the website
// catalog isn't available (e.g. for outside contributors who only have this repo).
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const catalogDir = process.env.MC_WEBSITE_CATALOG || path.resolve(ROOT, '..', 'master-claude', 'catalog');

if (!fs.existsSync(catalogDir)) {
  console.log(`(sync-check skipped — website catalog not found at ${catalogDir}; set MC_WEBSITE_CATALOG to enable)`);
  process.exit(0);
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

// Plugin ids = each skill folder name (holding SKILL.md) + each agent file basename.
const pluginIds = new Set([
  ...walk(path.join(ROOT, 'skills')).filter((p) => p.endsWith('SKILL.md')).map((p) => path.basename(path.dirname(p))),
  ...walk(path.join(ROOT, 'agents')).filter((p) => p.endsWith('.md')).map((p) => path.basename(p, '.md')),
]);
const catalogIds = new Set(
  fs.readdirSync(catalogDir).filter((d) => fs.existsSync(path.join(catalogDir, d, 'meta.json')))
);

// Intentional differences: the conductor itself isn't a catalog product; the bundled `grill-me`
// skill corresponds to the catalog's `cap-grill-me`.
const NOT_IN_CATALOG = new Set(['master-claude', 'grill-me']);
const NOT_IN_PLUGIN = new Set(['cap-grill-me']);

const missingFromCatalog = [...pluginIds].filter((id) => !catalogIds.has(id) && !NOT_IN_CATALOG.has(id));
const missingFromPlugin = [...catalogIds].filter((id) => !pluginIds.has(id) && !NOT_IN_PLUGIN.has(id));

if (missingFromCatalog.length || missingFromPlugin.length) {
  if (missingFromCatalog.length) console.error('✗ in plugin but MISSING from website catalog/:\n  ' + missingFromCatalog.join('\n  '));
  if (missingFromPlugin.length) console.error('✗ in website catalog/ but MISSING from plugin skills/:\n  ' + missingFromPlugin.join('\n  '));
  console.error('\nAdd the missing catalog/<id>/{meta.json,content.md} (or the skill), regenerate catalog.json,');
  console.error('and follow docs/ADDING-A-CAPABILITY.md.');
  process.exit(1);
}
console.log(`✓ in sync: ${pluginIds.size} plugin skills ↔ ${catalogIds.size} catalog items`);
