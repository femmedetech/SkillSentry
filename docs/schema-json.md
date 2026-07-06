# Contrat de sortie JSON (`--json`)

Pour les intégrateurs. `audit.mjs` émet un objet unique sur stdout et sort avec
un code = verdict (`0` SÛRE, `1` SUSPECTE, `2` DANGEREUSE, `3` erreur).

## Mode skill unique (`mode: "single"`)

```json
{
  "mode": "single",
  "target": "chemin/skill",
  "verdict": "DANGEREUSE",
  "verdictCode": 2,
  "fileCount": 2,
  "findings": [
    {
      "severity": "CRITICAL",
      "category": "exec-chargement",
      "file": "SKILL.md",
      "line": 24,
      "message": "…",
      "evidence": "…",
      "suppressed": "inline"
    }
  ]
}
```

- `severity` : `CRITICAL | HIGH | MEDIUM | LOW | INFO`.
- `category` : slug stable (`exec-chargement`, `prompt-injection`,
  `exfiltration`, `secret-en-dur`, `env-harvest`, `vol-identifiants`,
  `download-exec`, `persistance`, `obfuscation`, `unicode-cache`,
  `outils-dangereux`, `fichier-sensible`, `backdoor`, `hook-embarque`,
  `hook-plugin`, `mcp`, `subagent`, `dependance`, `structure`).
- `suppressed` : absent si le finding compte ; sinon `"inline" | "ignore" |
  "allow" | "minSeverity"` (raison de la mise en sourdine ; exclu du verdict).

## Mode projet (`mode: "project"`)

```json
{
  "mode": "project",
  "root": "chemin/projet",
  "overallVerdict": "DANGEREUSE",
  "verdictCode": 2,
  "skillCount": 2,
  "skills": [
    {
      "name": ".claude/skills/evil",
      "dir": "…/.claude/skills/evil",
      "verdict": "DANGEREUSE",
      "verdictCode": 2,
      "fileCount": 1,
      "findings": [ /* même forme que ci-dessus */ ]
    }
  ]
}
```

Le verdict global est le pire verdict parmi les skills.

## Sortie SARIF (`--sarif`)

Document SARIF 2.1.0 (`runs[0].results`), compatible upload GitHub code
scanning. Seuls les findings non supprimés sont inclus. `ruleId` = `category`,
`level` = `error` (CRITICAL/HIGH) / `warning` (MEDIUM) / `note` (LOW/INFO).
