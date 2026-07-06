# install.ps1 — Installe la skill « check-skill » au niveau utilisateur.
# Copie skill/ vers ~/.claude/skills/check-skill/ pour la rendre disponible
# dans tous vos projets via /check-skill.

$ErrorActionPreference = 'Stop'

$source = Join-Path $PSScriptRoot 'skills\check-skill'
$destRoot = Join-Path $env:USERPROFILE '.claude\skills'
$dest = Join-Path $destRoot 'check-skill'

if (-not (Test-Path $source)) {
    Write-Error "Dossier source introuvable : $source"
    exit 1
}

# Vérifie que Node est disponible (requis par le scanner).
$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) {
    Write-Warning "Node.js est introuvable dans le PATH. Le scanner audit.mjs en a besoin."
}

if (-not (Test-Path $destRoot)) {
    New-Item -ItemType Directory -Path $destRoot -Force | Out-Null
}

if (Test-Path $dest) {
    Write-Host "Mise à jour de la skill existante dans $dest"
    Remove-Item -Recurse -Force $dest
}

Copy-Item -Recurse -Force $source $dest

Write-Host ""
Write-Host "✅ Skill installée dans : $dest" -ForegroundColor Green
Write-Host ""
Write-Host "Usage : dans n'importe quel projet, lancez"
Write-Host "    /check-skill <chemin-de-la-skill-à-auditer>"
Write-Host ""
Write-Host "Exemple :"
Write-Host "    /check-skill C:\Users\$env:USERNAME\Downloads\une-skill-douteuse"
