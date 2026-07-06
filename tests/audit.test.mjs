// Tests de SkillSentry — exécutés avec `node --test` (aucune dépendance).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT = path.join(ROOT, 'skills', 'check-skill', 'scripts', 'audit.mjs');
const FIX = path.join(ROOT, 'tests', 'fixtures');

// Lance le scanner et retourne { data, code } (le code non nul est normal).
function scan(args) {
  try {
    const out = execFileSync('node', [AUDIT, ...args, '--json'], { encoding: 'utf8' });
    return { data: JSON.parse(out), code: 0 };
  } catch (e) {
    return { data: JSON.parse(e.stdout), code: e.status };
  }
}

test('skill saine → SÛRE, 0 finding, exit 0', () => {
  const { data, code } = scan([path.join(FIX, 'benign-skill')]);
  assert.equal(data.mode, 'single');
  assert.equal(data.verdict, 'SÛRE');
  assert.equal(data.findings.filter((f) => !f.suppressed).length, 0);
  assert.equal(code, 0);
});

test('skill piégée → DANGEREUSE, exit 2', () => {
  const { data, code } = scan([path.join(FIX, 'malicious-skill')]);
  assert.equal(data.verdict, 'DANGEREUSE');
  assert.equal(code, 2);
});

test('détection de secrets en dur (AWS + GitHub)', () => {
  const { data } = scan([path.join(FIX, 'malicious-skill')]);
  const secrets = data.findings.filter((f) => f.category === 'secret-en-dur');
  assert.ok(secrets.length >= 2, 'au moins 2 secrets détectés');
});

test('couverture large des catégories sur la skill piégée', () => {
  const { data } = scan([path.join(FIX, 'malicious-skill')]);
  const cats = new Set(data.findings.map((f) => f.category));
  for (const c of ['exec-chargement', 'exfiltration', 'prompt-injection',
    'unicode-cache', 'outils-dangereux', 'secret-en-dur', 'env-harvest',
    'vol-identifiants', 'download-exec', 'persistance']) {
    assert.ok(cats.has(c), `catégorie manquante : ${c}`);
  }
});

test('mode projet : découvre plusieurs skills, verdict global = pire', () => {
  const { data, code } = scan([FIX]);
  assert.equal(data.mode, 'project');
  assert.ok(data.skillCount >= 4);
  assert.equal(data.overallVerdict, 'DANGEREUSE');
  assert.equal(code, 2);
});

test('mode projet : layout .claude/skills', () => {
  const { data } = scan([path.join(FIX, 'project-with-skills')]);
  assert.equal(data.skillCount, 2);
  const evil = data.skills.find((s) => /evil/.test(s.name));
  const good = data.skills.find((s) => /good/.test(s.name));
  assert.equal(evil.verdict, 'DANGEREUSE');
  assert.equal(good.verdict, 'SÛRE');
});

test('--single force le mode skill unique', () => {
  const { data } = scan([path.join(FIX, 'project-with-skills'), '--single']);
  assert.equal(data.mode, 'single');
});

test('suppression inline skillguard-ignore', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-'));
  fs.writeFileSync(path.join(tmp, 'SKILL.md'),
    '---\nname: t\ndescription: test\n---\nCle AKIAIOSFODNN7EXAMPLE <!-- skillguard-ignore -->\n');
  const { data, code } = scan([tmp]);
  assert.equal(data.verdict, 'SÛRE');
  assert.equal(code, 0);
  assert.ok(data.findings.some((f) => f.suppressed === 'inline'));
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('config failOn / minSeverity respectée', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ss-'));
  fs.writeFileSync(path.join(tmp, 'SKILL.md'),
    '---\nname: t\ndescription: test\n---\nUtilise process.env pour lire un token.\n');
  fs.writeFileSync(path.join(tmp, 'skillguard.config.json'),
    JSON.stringify({ minSeverity: 'MEDIUM', failOn: 'CRITICAL' }));
  const { data, code } = scan([tmp]);
  // env-harvest est HIGH < CRITICAL → SUSPECTE mais pas DANGEREUSE, exit != 2
  assert.notEqual(code, 2);
  assert.equal(data.verdict, 'SUSPECTE');
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('sortie SARIF 2.1.0 valide', () => {
  const out = (() => {
    try { return execFileSync('node', [AUDIT, path.join(FIX, 'malicious-skill'), '--sarif'], { encoding: 'utf8' }); }
    catch (e) { return e.stdout; }
  })();
  const sarif = JSON.parse(out);
  assert.equal(sarif.version, '2.1.0');
  assert.equal(sarif.runs.length, 1);
  assert.ok(sarif.runs[0].results.length > 0);
  assert.ok(sarif.runs[0].tool.driver.rules.length > 0);
});
