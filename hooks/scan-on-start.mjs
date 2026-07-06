#!/usr/bin/env node
// scan-on-start.mjs — Hook SessionStart : audite ./.claude/skills au démarrage,
// compare à une baseline et alerte (sans bloquer) si une skill apparaît, change,
// ou est jugée dangereuse.
//
// Sortie non bloquante : imprime un contexte pour Claude sur stdout (exit 0).
// Ne suit jamais et n'exécute jamais le contenu audité — il lance seulement
// le scanner audit.mjs en sous-processus et lit son JSON.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Lit le JSON du hook sur stdin (fournit cwd), avec repli sur process.cwd().
function readCwd() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    if (raw.trim()) {
      const j = JSON.parse(raw);
      if (j.cwd) return j.cwd;
    }
  } catch { /* pas d'entrée : on utilise le cwd du process */ }
  return process.cwd();
}

const cwd = readCwd();
const skillsDir = path.join(cwd, '.claude', 'skills');
if (!fs.existsSync(skillsDir)) process.exit(0); // rien à surveiller

// Localise audit.mjs (à côté, dans skills/check-skill/scripts/).
const auditPath = path.join(import.meta.dirname, '..', 'skills', 'check-skill', 'scripts', 'audit.mjs');
if (!fs.existsSync(auditPath)) process.exit(0);

// Hash de tous les fichiers d'une skill (pour détecter les changements).
function hashSkill(dir) {
  const h = crypto.createHash('sha256');
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile()) { try { h.update(e.name); h.update(fs.readFileSync(full)); } catch { /* skip */ } }
    }
  };
  try { walk(dir); } catch { /* skip */ }
  return h.digest('hex');
}

// Lance le scanner en mode projet.
let result;
try {
  const out = execFileSync('node', [auditPath, skillsDir, '--json'], { encoding: 'utf8' });
  result = JSON.parse(out);
} catch (e) {
  // audit.mjs sort avec un code non nul quand il trouve des risques : stdout reste valide.
  try { result = JSON.parse(e.stdout || ''); } catch { process.exit(0); }
}
if (!result || result.mode !== 'project' || !result.skills) process.exit(0);

// Baseline des hashes.
const baselinePath = path.join(cwd, '.claude', '.skillguard-baseline.json');
let baseline = {};
try { baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); } catch { /* première fois */ }

const alerts = [];
const nextBaseline = {};
for (const s of result.skills) {
  const hash = hashSkill(s.dir);
  nextBaseline[s.name] = hash;
  const known = baseline[s.name];
  if (known === undefined) alerts.push(`🆕 Nouvelle skill « ${s.name} » (verdict ${s.verdict}).`);
  else if (known !== hash) alerts.push(`✏️  Skill modifiée « ${s.name} » (verdict ${s.verdict}).`);
  if (s.verdictCode >= 2) alerts.push(`🔴 Skill DANGEREUSE « ${s.name} » — lancez /check-skill ${s.dir}`);
}

// Persiste la nouvelle baseline (best effort).
try { fs.writeFileSync(baselinePath, JSON.stringify(nextBaseline, null, 2)); } catch { /* ignore */ }

if (alerts.length > 0) {
  console.log('⚠️  SkillSentry — vérification des skills du projet :');
  for (const a of alerts) console.log('   ' + a);
  console.log('   (Analyse déterministe automatique ; utilisez /check-skill pour un audit complet.)');
}
process.exit(0);
