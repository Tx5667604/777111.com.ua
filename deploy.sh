#!/bin/bash
set -e
cd "$(dirname "$0")"
npm run build
DEPLOY_DIR=$(mktemp -d)
cp -r out/* "$DEPLOY_DIR/"
cd "$DEPLOY_DIR"
echo "777111.com.ua" > CNAME
touch .nojekyll
git init
git add -A
git commit -m "deploy $(date +%Y-%m-%d_%H:%M)"
git push https://github.com/Tx5667604/777111.com.ua.git HEAD:main --force
rm -rf "$DEPLOY_DIR"
echo "✅ Deployed!"
