#!/usr/bin/env node
// Checks data/data.js for broken references, duplicate ids and missing fields.
// Usage: node tools/validate-data.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'data', 'data.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(src, sandbox, { filename: 'data/data.js' });
const D = sandbox.window.BPRE_DATA;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const isInt = (n, min = 0) => Number.isInteger(n) && n >= min;

if (!D) {
  console.error('data/data.js did not set window.BPRE_DATA');
  process.exit(1);
}

function ids(list, label) {
  const seen = new Set();
  for (const x of list || []) {
    if (!x.id || typeof x.id !== 'string') err(`${label}: an entry has no id (${JSON.stringify(x).slice(0, 60)})`);
    else if (seen.has(x.id)) err(`${label}: duplicate id "${x.id}"`);
    else if (!/^[a-z0-9-]+$/.test(x.id)) err(`${label}: id "${x.id}" should be lowercase letters, numbers and hyphens`);
    seen.add(x.id);
    if (!x.name && label !== 'ratios') err(`${label} "${x.id}": missing name`);
  }
  return seen;
}

const sets = ids(D.sets, 'sets');
ids(D.modes, 'modes');
const factions = ids(D.factions, 'factions');
const units = ids(D.units, 'units');
const cards = ids(D.cards, 'cards');
const options = ids(D.options, 'options');
ids(D.ratios, 'ratios');
const modeIds = new Set((D.modes || []).map((m) => m.id));

for (const m of D.modes || []) {
  if (!Array.isArray(m.presets) || !m.presets.length) err(`mode "${m.id}": presets must be a non-empty array`);
  for (const p of m.presets || []) {
    if (!isInt(p.points, 1)) err(`mode "${m.id}": preset points must be positive whole numbers`);
    if (!p.label) warn(`mode "${m.id}": preset ${p.points} has no label`);
  }
  if (!(m.presets || []).some((p) => p.points === m.defaultPoints)) err(`mode "${m.id}": defaultPoints ${m.defaultPoints} is not one of its presets`);
  for (const s of m.unitSets || []) if (!sets.has(s)) err(`mode "${m.id}": unknown set "${s}" in unitSets`);
  const depIds = new Set(['main', 'qrf']);
  for (const d of m.deployments || []) {
    if (!d.id || depIds.has(d.id)) err(`mode "${m.id}": deployment id "${d.id}" is missing or reused`);
    depIds.add(d.id);
    if (!d.name) err(`mode "${m.id}": deployment "${d.id}" has no name`);
    if (!isInt(d.points, 1)) err(`mode "${m.id}": deployment "${d.id}" needs whole-number points`);
    for (const u of d.allowedUnits || []) if (!units.has(u)) err(`mode "${m.id}": deployment "${d.id}" allows unknown unit "${u}"`);
  }
  for (const sl of m.fireSlots || []) {
    if (!sl.id || !sl.name) err(`mode "${m.id}": every fire slot needs an id and name`);
  }
  if ((m.fireSlots || []).length && !(D.cards || []).some((c) => c.slot)) warn(`mode "${m.id}" has fire slots but no cards are marked slot: true`);
  for (const k of ['interventionLimit', 'firesLimit']) {
    if (m[k] != null && !isInt(m[k])) err(`mode "${m.id}": ${k} must be a whole number or null`);
  }
}

for (const f of D.factions || []) {
  for (const a of f.allies || []) {
    if (!factions.has(a)) err(`faction "${f.id}": unknown ally "${a}"`);
    else if (!(D.factions.find((x) => x.id === a).allies || []).includes(f.id)) warn(`faction "${f.id}" lists "${a}" as an ally, but not the other way round`);
  }
}

for (const o of D.options || []) {
  if (!isInt(o.cost)) err(`option "${o.id}": cost must be a whole number`);
  for (const m of o.modes || []) if (!modeIds.has(m)) err(`option "${o.id}": unknown mode "${m}"`);
}

for (const u of D.units || []) {
  if (!factions.has(u.faction)) err(`unit "${u.id}": unknown faction "${u.faction}"`);
  if (!sets.has(u.set)) err(`unit "${u.id}": unknown set "${u.set}"`);
  if (u.cost === null || u.cost === undefined) warn(`unit "${u.id}": no cost`);
  else if (!isInt(u.cost)) err(`unit "${u.id}": cost must be a whole number`);
  if (u.move != null && typeof u.move !== 'number') err(`unit "${u.id}": move must be a number`);
  if (u.perPoints != null && !isInt(u.perPoints, 1)) err(`unit "${u.id}": perPoints must be a whole number`);
  for (const f of u.fires || []) {
    if (!cards.has(f.card)) err(`unit "${u.id}": fires refers to unknown card "${f.card}"`);
    if (!isInt(f.count, 1)) err(`unit "${u.id}": fires count must be 1 or more`);
  }
  for (const o of u.options || []) if (!options.has(o)) err(`unit "${u.id}": unknown option "${o}"`);
}

for (const r of D.ratios || []) {
  for (const id of [...(r.members || []), ...(r.per || [])]) if (!units.has(id)) err(`ratio "${r.id}": unknown unit "${id}"`);
  if (!isInt(r.max, 1)) err(`ratio "${r.id}": max must be a whole number`);
}

for (const c of D.cards || []) {
  if (!['intervention', 'special', 'fires'].includes(c.type)) err(`card "${c.id}": type must be "intervention", "special" or "fires"`);
  if (!sets.has(c.set)) err(`card "${c.id}": unknown set "${c.set}"`);
  for (const f of c.factions || []) if (!factions.has(f)) err(`card "${c.id}": unknown faction "${f}"`);
  if (c.notes && c.notes.length > 100) warn(`card "${c.id}": notes are long. Put the full effect in "text".`);
  if (c.type !== 'special' && !c.text) warn(`card "${c.id}": no "text" for the Full effect panel`);
}

for (const w of warnings) console.log('warn  ' + w);
for (const e of errors) console.log('ERROR ' + e);
const byType = (t) => (D.cards || []).filter((c) => c.type === t).length;
console.log(`\n${D.units.length} units, ${byType('intervention')} Intervention, ${byType('special')} Special Intervention and ${byType('fires')} Fires cards.`);
if (errors.length) {
  console.log(`${errors.length} error(s).`);
  process.exit(1);
}
console.log('Data OK.');
