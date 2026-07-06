# Politique de sécurité

SkillSentry est un outil de sécurité : le prendre au sérieux commence par la
façon dont on traite ses propres vulnérabilités.

## Signaler une vulnérabilité

**Ne créez pas d'issue publique** pour une faille de sécurité. Privilégiez la
divulgation privée :

1. **GitHub Security Advisories** (recommandé) : onglet *Security* du dépôt →
   *Report a vulnerability*. C'est privé et suivi.
2. À défaut, contact : **femmedetech.contact@gmail.com**.

Merci d'inclure : description, impact, étapes de reproduction, version
concernée, et si possible une preuve de concept (avec des valeurs **factices** —
jamais de vrai secret).

## Délais indicatifs

- Accusé de réception : sous **72 h**.
- Première évaluation : sous **7 jours**.
- Correctif : selon la sévérité ; on te tiendra informé·e.

## Périmètre

Sont dans le périmètre :
- Un contournement du scanner (une skill malveillante non détectée / faux négatif exploitable).
- Une **injection de l'analyseur lui-même** : du contenu audité qui parviendrait
  à faire exécuter du code ou à détourner l'outil (le scanner doit toujours
  traiter le contenu comme de la donnée, jamais comme des instructions).
- Une fuite de données depuis l'environnement d'exécution du scanner.

Hors périmètre :
- Les faux positifs (ouvrez une issue normale).
- Les limites documentées (supply-chain hors analyse statique locale : voir
  `docs/couverture-menaces.md`).

## Rappel d'usage

Aucun scanner n'est infaillible. SkillSentry est un **filtre de premier niveau**
et ne remplace pas une lecture humaine du code pour les skills sensibles.
