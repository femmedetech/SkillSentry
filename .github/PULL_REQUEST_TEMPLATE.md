## Description
<!-- Que change cette PR et pourquoi ? -->

## Type de changement
- [ ] Correction de bug
- [ ] Nouvelle détection / fonctionnalité
- [ ] Documentation
- [ ] Autre :

## Checklist
- [ ] `npm test` est vert
- [ ] Aucun faux positif introduit sur `tests/fixtures/benign-skill` (reste 🟢)
- [ ] Si nouvelle détection : un vecteur (valeurs **factices**) a été ajouté à
      `tests/fixtures/malicious-skill/` et couvert par un test
- [ ] `docs/couverture-menaces.md` mis à jour si la couverture change
- [ ] Zéro dépendance externe ajoutée (contrainte du projet)
- [ ] Le code ne suit/n'exécute jamais le contenu audité (il reste de la donnée)
