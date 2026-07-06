#!/usr/bin/env bash
# install.sh — Installe la skill « check-skill » au niveau utilisateur (macOS/Linux).
# Copie skill/ vers ~/.claude/skills/check-skill/ pour la rendre disponible
# dans tous vos projets via /check-skill.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE="$SCRIPT_DIR/skills/check-skill"
DEST_ROOT="$HOME/.claude/skills"
DEST="$DEST_ROOT/check-skill"

if [ ! -d "$SOURCE" ]; then
  echo "Erreur : dossier source introuvable : $SOURCE" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Attention : Node.js est introuvable dans le PATH. Le scanner audit.mjs en a besoin." >&2
fi

mkdir -p "$DEST_ROOT"

if [ -d "$DEST" ]; then
  echo "Mise à jour de la skill existante dans $DEST"
  rm -rf "$DEST"
fi

cp -R "$SOURCE" "$DEST"

echo ""
echo "✅ Skill installée dans : $DEST"
echo ""
echo "⚠️  Rechargez/redémarrez votre session Claude Code pour voir /check-skill."
echo ""
echo "Usage :"
echo "    /check-skill <chemin-d-une-skill-ou-d-un-projet>"
echo "    /check-skill            # audite le projet courant"
