#!/bin/zsh
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "🔴 Fermeture du serveur de développement (port 3000)..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "Aucun processus sur le port 3000."

echo "🟢 Démarrage du serveur Next.js..."
cd "$ROOT"

if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc"
fi

if [ -f "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

npm run dev
