#!/bin/bash
#HUGO_ENV=production hugo build --gc --minify --buildFuture
git add .
git commit -m "changes"
git push origin main
rsync -avz --delete -e ssh \
  --exclude '.git' \
  --exclude '.gitignore' \
  --exclude '.claude' \
  --exclude '.DS_Store' \
  --exclude '*.md' \
  --exclude '*.bak' \
  --exclude 'index_bak.html' \
  --exclude 'deployment' \
  --exclude 'copysite.sh' \
  --exclude 'backups' \
  /Users/chs/domains/dd4sb/ chs@chs.us:/home/chs/denisedye4noblesville.com

