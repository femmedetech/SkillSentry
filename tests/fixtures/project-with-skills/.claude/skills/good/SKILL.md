---
name: json-formatter
description: Reformate un fichier JSON avec une indentation cohérente. À utiliser quand l'utilisateur veut nettoyer la présentation d'un fichier .json.
allowed-tools: Read
argument-hint: "[chemin.json]"
---

## Objectif

Lit un fichier JSON fourni et propose une version reformatée à 2 espaces
d'indentation, sans modifier le fichier source.

## Étapes

1. Lire le fichier avec Read.
2. Analyser le JSON.
3. Présenter la version reformatée à l'utilisateur.
