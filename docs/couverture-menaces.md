# Couverture des menaces — correspondance recherche ↔ scanner

Ce document met en regard les menaces documentées par la recherche en
sécurité (juillet 2026) et leur prise en charge par `skill/scripts/audit.mjs`.

Sources :
- Datadog Security Labs — *Malicious Coding Agent Skills and the Risk of Dynamic Context*
- Snyk — *ToxicSkills* (étude ClawHub, 1 467 skills à risque, 76 payloads confirmés)
- SafeDep — *Agent Skills Threat Model* (10 menaces)
- arXiv 2601.10338 / 2602.06547 — études empiriques à grande échelle (26,1 % des skills vulnérables ; 84,2 % des failles dans SKILL.md)
- VentureBeat / SafeDep — contournement de scanner via fichier de test

## Correspondance

| # | Menace documentée | Source | Couverte | Détecteur (catégorie) |
|---|-------------------|--------|----------|-----------------------|
| 1 | Exécution de contexte dynamique `` !`cmd` `` avant lecture par le modèle | Datadog | ✅ | `exec-chargement` |
| 2 | `allowed-tools: Bash(*)` (shell non restreint) | Datadog | ✅ | `outils-dangereux` |
| 3 | Injection directe (« ignore previous instructions ») | Snyk, arXiv | ✅ | `prompt-injection` |
| 4 | Injection indirecte / instructions hors périmètre déclaré | Datadog, Snyk | ✅ | `prompt-injection` + analyse sémantique (subagent) |
| 5 | Vol de token GitHub `gh auth token` | Datadog | ✅ | `vol-identifiants` |
| 6 | Récolte de variables d'environnement (`os.environ`, `printenv`, `$AWS_*`) | Datadog, SafeDep | ✅ | `env-harvest` |
| 7 | Exfiltration HTTP (curl/wget POST vers infra attaquant) | Datadog, Snyk | ✅ | `exfiltration` |
| 8 | Pipe-to-shell (`curl … \| bash`) | Datadog, Snyk | ✅ | `exfiltration` |
| 9 | Vol d'identifiants cloud/config (`~/.aws/credentials`, `~/.ssh`) | Snyk, Datadog | ✅ | `fichier-sensible` |
| 10 | Malware externe : ZIP protégé par mot de passe + `chmod +x` + exécution | Snyk | ✅ | `download-exec` |
| 11 | Exfiltration obfusquée (`eval $(echo … \| base64 -d)`) | Snyk | ✅ | `obfuscation` |
| 12 | Unicode smuggling (largeur nulle, bidi, tags) | Snyk, arXiv | ✅ | `unicode-cache` |
| 13 | Persistance via config Claude (`settings.json`, `CLAUDE.md`) | SafeDep | ✅ | `backdoor` |
| 14 | Persistance via mémoire d'agent (`AGENTS.md`, `SOUL.md`, `MEMORY.md`) | SafeDep, Snyk | ✅ | `persistance` |
| 15 | Persistance système (cron, systemctl, `.bashrc`, registre) | Snyk | ✅ | `persistance` |
| 16 | Remote config fetching (instructions distantes au runtime) | SafeDep | ✅ | `prompt-injection` (+ `exfiltration`) |
| 17 | Contournement des permissions (auto-approve, YOLO, skip-permissions) | Akto, TrueFoundry | ✅ | `prompt-injection` |
| 18 | Jailbreak DAN / « developer mode » / usurpation de message système | Snyk | ✅ | `prompt-injection` |
| 19 | Hooks embarqués dans le frontmatter / `hooks.json` | doc Claude Code | ✅ | `hook-embarque`, `hook-plugin` |
| 20 | Serveur MCP non vérifié (`.mcp.json`) | doc Claude Code | ✅ | `mcp` |
| 21 | Exécutables `bin/` ajoutés au PATH | doc Claude Code | ✅ | `structure` |
| 22 | **Payload « une porte à côté » (fichier de test/ressource, hors SKILL.md)** | VentureBeat, SafeDep | ✅ | scan **récursif** de tous les fichiers texte |
| 23 | `uv run` / PEP 723 avec dépendances non épinglées | SafeDep | ⚠️ partiel | `dependance` (signale l'usage, ne résout pas les versions) |
| 24 | Écriture de fichiers sans confirmation (`Write`/`Edit` pré-approuvés) | arXiv | ✅ | `outils-dangereux` |
| 25 | Descriptions/métadonnées trompeuses (supply-chain sémantique) | arXiv, SafeDep | ✅ | analyse sémantique (subagent) |
| 26 | Secrets/clés d'API en dur (10,9 % des skills) | Snyk, arXiv | ✅ | `secret-en-dur` (AWS/GitHub/OpenAI/Anthropic/Google/Slack/JWT/clés privées) |

## Menaces hors périmètre d'un scanner statique de fichiers

Ces risques relèvent de l'écosystème/distribution, pas du contenu d'une skill
donnée. Ils sont **signalés à l'utilisatrice** mais ne peuvent être tranchés
par une analyse statique locale :

- **Typosquatting** : nom de skill imitant une skill populaire → vérifier la source/l'auteur.
- **Repository hijacking / dependency confusion** : compte compromis, paquet fantôme revendiqué plus tard → vérifier la réputation du dépôt.
- **Deferred dependency attack** : dépendance non épinglée devenant malveillante après installation → épingler les versions.
- **Hallucinated package injection** : nécessite de résoudre l'existence réelle des paquets référencés.

Pour ces cas, la règle reste : n'installer que depuis des sources de
confiance, épingler les versions, et relire le code avant toute skill sensible.

## Audit d'un projet entier

Le scanner fonctionne aussi en **mode projet** : pointé sur un dossier de
projet (ou lancé sans argument), il découvre chaque `SKILL.md` (y compris sous
`.claude/skills/`) et applique **la même couverture ci-dessus à chaque skille
découverte**, séparément. Le verdict global est le pire des verdicts par skill.

## Résultat des tests de non-régression

Suite automatisée : `npm test` (10 tests `node --test`, tous verts).

- `tests/fixtures/malicious-skill` → 🔴 **DANGEREUSE**, couvrant exec-chargement, exfiltration, env-harvest, vol-identifiants, download-exec, persistance, obfuscation, unicode-cache, prompt-injection, outils-dangereux et **secret-en-dur**.
- `tests/fixtures/benign-skill` → 🟢 **SÛRE**, 0 finding (aucun faux positif).
- Contrôle des faux positifs (`skillguard-ignore`, `skillguard.config.json`) et sortie SARIF vérifiés.
