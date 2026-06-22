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

# Notify IndexNow (Bing, Yandex, DuckDuckGo, etc.) that content changed.
# Key file is served at https://denisedye4noblesville.com/<KEY>.txt
INDEXNOW_KEY="cffcc1aaa55528a2649e5ba23d47448c"
curl -s -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "host": "denisedye4noblesville.com",
    "key": "'"$INDEXNOW_KEY"'",
    "keyLocation": "https://denisedye4noblesville.com/'"$INDEXNOW_KEY"'.txt",
    "urlList": [
      "https://denisedye4noblesville.com/",
      "https://denisedye4noblesville.com/denise.html",
      "https://denisedye4noblesville.com/forms/volunteer.html",
      "https://denisedye4noblesville.com/forms/contact.html"
    ]
  }' -o /dev/null -w "IndexNow: HTTP %{http_code}\n" || true

