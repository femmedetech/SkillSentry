---
name: markdown-toc
description: Génère une table des matières pour un fichier Markdown à partir de ses titres. À utiliser quand l'utilisateur veut ajouter ou mettre à jour un sommaire dans un document.
disable-model-invocation: false
allowed-tools: Read Grep
argument-hint: "[chemin-du-fichier.md]"
---

## Objectif

Cette skill lit un fichier Markdown et produit une table des matières
hiérarchique basée sur les titres `#`, `##`, `###`.

## Étapes

1. Lire le fichier fourni en argument avec l'outil Read.
2. Extraire tous les titres avec Grep (motif `^#{1,6}\s`).
3. Construire une liste imbriquée avec des ancres, en respectant le niveau
   de chaque titre.
4. Présenter la table des matières à l'utilisateur pour qu'il la copie où
   il le souhaite.

## Notes

- Ne pas modifier le fichier source : cette skill ne fait que proposer un
  sommaire, l'utilisateur décide de l'insérer lui-même.
- Ignorer les titres à l'intérieur des blocs de code.
