# nginx vhost

`denisedye4noblesville.com.conf` is the production nginx server config for the
site. It is a **reference copy** of what runs on chs.us — `copysite.sh` does
**not** deploy it (the whole `deployment/` dir is excluded from the rsync, and
nginx configs live under `/etc/nginx`, not the webroot).

## What it does
- Serves the static site from `/home/chs/denisedye4noblesville.com`.
- Forces HTTPS (HTTP :80 → 301), with a Let's Encrypt cert (certbot-managed lines).
- Security headers (HSTS, CSP allowing Clicky, X-Frame-Options, etc.).
- Cache policy via the `map $uri $cache_control` block:
  - HTML / everything else → `no-store` (always fresh)
  - CSS, JS → `public, max-age=3600` (1 hour)
  - images, fonts, favicon → `public, max-age=604800` (7 days)
- Blocks `.md`, `.bak`, and dotfiles (returns 404).
- Clicky anti-adblock proxy: tracking JS at `/1a5ae8c8beb7e24874.js`
  (proxied from static.getclicky.com, small 1h server-side cache) and the
  beacon at `/b31b20043c0afc10d0` (proxied to in.getclicky.com, uncached).
  Site id `101507558`.

## Updating production from this file
```bash
scp deployment/nginx/denisedye4noblesville.com.conf \
    chs@chs.us:/tmp/denisedye4noblesville.com.conf
ssh chs@chs.us '
  sudo cp /etc/nginx/sites-available/denisedye4noblesville.com.conf{,.bak.$(date +%Y%m%d-%H%M%S)}
  sudo cp /tmp/denisedye4noblesville.com.conf /etc/nginx/sites-available/denisedye4noblesville.com.conf
  sudo nginx -t && sudo systemctl reload nginx
'
```

> The cert paths and the `listen 443 ssl` lines are `# managed by Certbot`.
> If you ever recreate the vhost from scratch on a host without the cert yet,
> start with only the `listen 80` server block and run
> `sudo certbot --nginx -d denisedye4noblesville.com` to have certbot add SSL.
