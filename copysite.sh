#!/bin/bash
#HUGO_ENV=production hugo build --gc --minify --buildFuture
#git add .
#git commit -m "changes"
#git push origin main
#rsync -avz --delete -e "ssh -p 65002" /Users/chs/domains/chs.us/public/ u910572643@46.202.182.60:/home/u910572643/domains/chs.us/public_html/
rsync -avz --delete -e ssh  /Users/chs/domains/dd4sb/ chs@chs.us:/home/chs/denisedye4noblesville.com

# Ping IndexNow (Bing/Yandex/DuckDuckGo) to notify of updated sitemap
#curl -s "https://api.indexnow.org/indexnow?url=https://chs.us/sitemap.xml&key=chs-us-indexnow" > /dev/null 2>&1 || true
