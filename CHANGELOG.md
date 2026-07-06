# Changelog

## 0.1.0

Première version publiable de **SkillSentry**.

### Ajouté
- Scanner déterministe `audit.mjs` (Node.js, zéro dépendance) couvrant ~28
  catégories de menaces : exécution au chargement `` !`cmd` ``, prompt
  injection (FR/EN), jailbreak/usurpation, exfiltration réseau, récolte de
  variables d'environnement, vol d'identifiants CLI, fichiers sensibles,
  persistance/backdoor, téléchargement-puis-exécution, obfuscation, Unicode
  caché, outils dangereux pré-approuvés, **secrets en dur** (AWS/GitHub/
  OpenAI/Anthropic/Google/Slack/JWT), hooks/MCP/structure.
- Skill `/check-skill` : audit d'une skill précise, d'un projet entier
  (découverte + audit skill par skill), ou du projet courant.
- **Contrôle des faux positifs** : `skillguard.config.json` (ignore,
  allowPatterns, minSeverity, failOn) et suppression inline `skillguard-ignore`.
- **Sortie SARIF 2.1.0** (`--sarif`) et JSON (`--json`).
- **Distribution** : paquet npm (`npx @femmedetech/skillsentry`), plugin Claude Code +
  marketplace, hook SessionStart (auto-scan + baseline), `install.ps1` /
  `install.sh`, GitHub Action.
- Suite de tests `node --test` et fixtures saine/piégée/projet.
