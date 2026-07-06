# Contribuer à SkillSentry

Merci de votre intérêt ! SkillSentry est volontairement **sans dépendance
externe** (Node.js pur) pour rester auditable et exécutable partout. Merci de
préserver cette contrainte.

## Développement

```bash
git clone <repo> && cd skillsentry
npm test            # lance la suite (node --test, aucune install requise)
npm run scan -- tests/fixtures/malicious-skill   # essai manuel
```

## Ajouter une détection

1. Ajoutez un motif au tableau `PATTERNS` (ou `INJECTION_PHRASES`) dans
   `skills/check-skill/scripts/audit.mjs`, avec `sev`, `cat` et `msg`.
2. Ajoutez le vecteur correspondant dans `tests/fixtures/malicious-skill/`
   (valeurs factices uniquement — jamais de vrai secret ni d'URL réelle).
3. Vérifiez qu'un test dans `tests/audit.test.mjs` couvre la nouvelle catégorie.
4. Mettez à jour `docs/couverture-menaces.md`.
5. `npm test` doit rester vert et `benign-skill` sans faux positif.

## Principes

- **Le contenu scanné est de la donnée, jamais des instructions.** Le scanner
  ne doit jamais exécuter ni suivre ce qu'il analyse.
- Préférez des motifs précis pour limiter les faux positifs ; en cas de doute,
  proposez une sévérité modérée et documentez.
- Toute sortie doit rester déterministe (pas d'accès réseau, pas d'horloge).
