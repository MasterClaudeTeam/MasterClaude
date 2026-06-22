# Telegram bridge — run the clone where api.telegram.org is blocked

If the machine running the clone can't reach `api.telegram.org` directly (e.g. it's blocked on your
network), route the Bot API through a **relay you control on a host that *can* reach Telegram** — the same
kind of server you may already use to send to Telegram. The clone points `TELEGRAM_API_BASE` at the relay;
the relay forwards every Bot API call **including `getUpdates` long-polling**, so messages flow *in* as well
as *out*. Your bot token stays in the clone's gitignored `.env` and only ever passes through the relay in the
request path — the relay never stores it.

```
clone host (Telegram blocked)  ──HTTPS──▶  your relay (US server)  ──HTTPS──▶  api.telegram.org
        TELEGRAM_API_BASE ────────────────────────┘     (+ x-bridge-secret)
```

## On the clone host (`.env`)
```
TELEGRAM_API_BASE=https://relay.yourdomain.com    # your relay's URL (no trailing /bot)
TELEGRAM_BRIDGE_SECRET=<a long random string>     # must match the relay's secret
```
Then `node clone-doctor.mjs` — the `telegram` check shows `… via bridge https://relay.yourdomain.com` and
passes once the relay works.

## On your server (the relay) — pick one

### A) The bundled relay (dependency-free Node — simplest)
Copy `clone-telegram-bridge.mjs` to the server and run it behind your existing TLS:
```
TELEGRAM_BRIDGE_SECRET=<same long random string> PORT=8787 node clone-telegram-bridge.mjs
```
Keep it up with systemd:
```ini
[Unit]
Description=clone telegram bridge
After=network-online.target

[Service]
Environment=TELEGRAM_BRIDGE_SECRET=<same long random string>
Environment=PORT=8787
ExecStart=/usr/bin/node /opt/clone/clone-telegram-bridge.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

### B) nginx (if you already run it — no Node needed)
```nginx
location /bot {
    proxy_pass https://api.telegram.org;
    proxy_set_header Host api.telegram.org;
    proxy_ssl_server_name on;
    proxy_read_timeout 120s;        # long-poll: must exceed the getUpdates hold (~50s)
    proxy_send_timeout 120s;
    if ($http_x_bridge_secret != "<same long random string>") { return 403; }
}
```
Set `TELEGRAM_API_BASE=https://yourdomain.com` on the clone host.

### C) Caddy
```
yourdomain.com {
    @bot path /bot*
    handle @bot {
        @noauth not header X-Bridge-Secret "<same long random string>"
        respond @noauth 403
        reverse_proxy https://api.telegram.org {
            header_up Host api.telegram.org
            transport http { read_timeout 120s }
        }
    }
}
```

## Security
- **Always require `TELEGRAM_BRIDGE_SECRET`** (or restrict by IP) so the relay isn't an open proxy to
  Telegram.
- **Use TLS end-to-end** — the bot token travels in the URL path.
- The relay only proxies `/bot<token>/<method>` paths plus a `/health` check; everything else is 404.
