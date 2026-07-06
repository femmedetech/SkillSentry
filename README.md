# SkillSentry - scanner de sécurité pour skills Claude Code

Outil défensif, **local et sans dépendance**, pour **vérifier une skill Claude
Code AVANT de l'installer**. Il détecte les attaques que des acteurs
malveillants glissent dans les skills partagées en ligne : prompt injection,
exécution shell automatique, exfiltration de données, secrets en dur,
caractères Unicode invisibles, outils dangereux pré-approuvés, hooks
malveillants.

Anthropic n'audite pas les skills/plugins des marketplaces et Claude Code n'a
aucun scanner intégré : c'est ce manque que SkillSentry comble.

## Comment ça marche

Analyse **hybride** en deux passes :

1. **Scanner déterministe** (`skills/check-skill/scripts/audit.mjs`, Node.js,
   zéro dépendance) — repère les patterns techniques et l'Unicode caché, avec
   fichier + numéro de ligne.
2. **Analyse sémantique** par un subagent Claude isolé — lit la skill *sans
   l'exécuter* pour détecter les injections subtiles en langage naturel.

Exposé comme skill `/check-skill` : verdict clair (🟢 SÛRE · 🟠 SUSPECTE ·
🔴 DANGEREUSE) + rapport détaillé. La décision d'installer reste la vôtre.

## Installation

Trois façons, selon l'usage.

### 1. Plugin Claude Code (recommandé pour les utilisateurs de skills)

```
/plugin marketplace add femmedetech/SkillSentry
/plugin install skillsentry
```

Fournit `/check-skill` **et** un contrôle automatique au démarrage (hook
`SessionStart` qui alerte si une skill du projet apparaît, change ou est
dangereuse).

### 2. Skill seule (script d'installation)

```powershell
.\install.ps1      # Windows
```
```bash
./install.sh       # macOS / Linux
```

Copie la skill dans `~/.claude/skills/check-skill/`. **Rechargez la session
Claude Code** ensuite pour voir `/check-skill`.

### 3. En ligne de commande (npx, hors Claude Code / CI)

```bash
npx @femmedetech/skillsentry <chemin>
```

Nécessite **Node.js ≥ 18** dans le PATH. (La commande installée reste
`skillsentry`.)

## Usage

**Une skill précise** — avant d'installer une skill téléchargée :
```
/check-skill C:\Users\vous\Downloads\skill-a-verifier
```

**Un projet entier** — découvre toutes les skills et les vérifie une par une :
```
/check-skill C:\Users\vous\mon-projet
```

**Sans argument** — audite le projet courant :
```
/check-skill
```

### Scanner seul (CLI)

```
node skills/check-skill/scripts/audit.mjs <chemin>     # skill unique OU projet (auto-détecté)
    --project   force la découverte multi-skills
    --single    force le mode skill unique
    --json      sortie JSON
    --sarif     sortie SARIF 2.1.0 (GitHub Security)
```

Codes de sortie : `0` = SÛRE, `1` = SUSPECTE, `2` = DANGEREUSE, `3` = erreur.
En mode projet, le code = **pire** verdict parmi les skills.

## Configuration (contrôle des faux positifs)

Placez un `skillguard.config.json` à la racine de la cible (voir
`skillguard.config.example.json`) :

```json
{ "ignore": ["**/vendor/**"], "allowPatterns": ["EXAMPLE"], "minSeverity": "LOW", "failOn": "HIGH" }
```

- `ignore` : globs de fichiers non scannés.
- `allowPatterns` : regexes ; un finding dont la preuve matche est ignoré.
- `minSeverity` : sévérité minimale conservée.
- `failOn` : sévérité à partir de laquelle le verdict est 🔴 (utile en CI).

Suppression ponctuelle en ligne : ajoutez `skillguard-ignore` (ou
`skillguard-ignore-next-line`) en commentaire près de la ligne concernée.

## Intégration continue (GitHub Actions)

```yaml
- uses: femmedetech/SkillSentry@v0
  with:
    path: ".claude/skills"
    fail-on: "HIGH"
```

Scanne les skills à chaque PR, échoue si l'une est dangereuse, et publie un
rapport SARIF dans l'onglet Security.

## Menaces couvertes

Couverture bâtie à partir de la recherche en sécurité (Datadog, Snyk
ToxicSkills, SafeDep, arXiv, VentureBeat) — détail dans
`docs/couverture-menaces.md`.

| Catégorie | Exemples détectés |
|-----------|-------------------|
| **Exécution au chargement** | `` !`commande` ``, blocs ```` ```! ```` (avant lecture par le modèle) |
| **Prompt injection** | « ignore previous instructions », « ne préviens pas l'utilisateur », redéfinition de rôle (FR + EN) |
| **Jailbreak / usurpation** | DAN / « developer mode », fausses balises `SYSTEM:` / `<system>` / `[INST]` |
| **Contournement des permissions** | « auto-approve », `--dangerously-skip-permissions`, « yolo mode » |
| **Exfiltration réseau** | curl/wget/nc, Invoke-WebRequest, `fetch()`, pipe-to-shell (`curl … \| bash`) |
| **Récolte de variables d'env.** | `printenv`, `env \|`, `os.environ`, `process.env`, `$AWS_*`, `$GITHUB_TOKEN` |
| **Vol d'identifiants CLI** | `gh auth token`, `aws configure get`, `docker login`, keychain macOS |
| **Secrets en dur** | clés AWS (`AKIA…`), GitHub (`ghp_…`), OpenAI/Anthropic (`sk-…`), Google (`AIza…`), Slack, JWT, clés privées |
| **Fichiers sensibles** | `~/.ssh`, `id_rsa`, `.aws/credentials`, `.env`, `.npmrc`, `.pgpass` |
| **Persistance / backdoor** | `settings.json`/`CLAUDE.md`, `AGENTS.md`/`SOUL.md`/`MEMORY.md`, cron/systemctl/`.bashrc` |
| **Téléchargement-puis-exécution** | `chmod +x && …`, archive `unzip -P` (évasion), binaires distants |
| **Obfuscation** | `base64 -d \| bash`, `eval $(… base64)`, base64/hex denses |
| **Unicode caché** | largeur nulle (U+200B…), inversion bidi (U+202E…), tags Unicode |
| **Outils dangereux** | `allowed-tools` avec `Bash(*)`, `Write`, `Edit`, `WebFetch` |
| **Hooks / MCP / structure** | hooks embarqués, `hooks.json`, `.mcp.json`, `uv run`/PEP 723, `bin/` |

### Le payload « une porte à côté »

La recherche (VentureBeat/SafeDep) montre que des scanners ont été contournés
en plaçant la charge **hors du SKILL.md**, dans un fichier voisin. SkillSentry
analyse **récursivement tous les fichiers texte** de la skill, pas seulement le
SKILL.md.

## Comparaison avec les alternatives

Des scanners existent déjà — **Snyk Agent Scan** (ex-`mcp-scan`), **NVIDIA
SkillSpector**, **agentigy/skillcheck**, **Repello SkillCheck**, **Cisco AI
Defense**. Le créneau de SkillSentry :

| | SkillSentry | Outils généralistes |
|-|-------------|---------------------|
| Dépendances | **aucune** (Node pur) | souvent Python / `uvx` / cloud |
| Fonctionnement | **100 % local et offline** | parfois service distant |
| Intégration Claude Code | **native** (skill + hook + plugin) | CLI externe |
| Analyse sémantique LLM | **oui** (subagent isolé) | rarement |
| Profondeur (AST, YARA) | regexes + heuristiques | plus profonde (SkillSpector) |

Pour une couverture maximale, SkillSentry peut servir de **première passe
rapide/offline** en complément d'un scanner plus profond.

## Structure du projet

```
skillsSecurityCheck/
├── skills/check-skill/
│   ├── SKILL.md                 La skill /check-skill (garde-fous anti-injection)
│   └── scripts/audit.mjs        Scanner déterministe
├── hooks/
│   ├── hooks.json               Déclaration du hook SessionStart
│   └── scan-on-start.mjs        Auto-scan + baseline
├── .claude-plugin/              plugin.json + marketplace.json
├── tests/                       Suite node --test + fixtures
├── action.yml                   GitHub Action
├── install.ps1 / install.sh
└── skillguard.config.example.json
```

## Tester

```bash
npm test
```

## Limites

Aucun scanner n'est infaillible. Les faux négatifs restent possibles
(nouvelles techniques, obfuscation avancée) ; les vecteurs de supply-chain
(typosquatting, hijacking de dépôt, dépendances différées) échappent à une
analyse statique locale. Pour une skill sensible, une lecture humaine du code
demeure conseillée. SkillSentry est un **filtre de premier niveau**, pas une
garantie.

## Contribuer & sécurité

- Contributions bienvenues — voir [`CONTRIBUTING.md`](CONTRIBUTING.md) et le
  [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).
- Une faille de sécurité ? **Ne pas** ouvrir d'issue publique — suivre
  [`SECURITY.md`](SECURITY.md) (divulgation responsable).

## Licence

[MIT](LICENSE) — libre d'utilisation, de modification et de redistribution.
