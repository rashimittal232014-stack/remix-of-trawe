# TraWe WhatsApp Gateway

Our own QR-based WhatsApp connection, so agencies don't need a paid provider
subscription for one-to-one chats. One isolated session per workspace.

## Requirements

This must run on an **always-on server** (VPS/container with a persistent disk).
It cannot run inside the TraWe app's serverless hosting, because a WhatsApp Web
session is a long-lived socket with encrypted state on disk.

Minimum: 1 vCPU / 1 GB RAM handles a handful of sessions; budget ~150 MB RAM per
active session. Mount a persistent volume for `sessions/` and back it up.

## Run

```bash
cd gateway
npm install
export TRAWE_WA_GATEWAY_TOKEN="<long random string, same value as in TraWe>"
export TRAWE_WA_ENC_KEY="<second long random string, keep it safe>"
export TRAWE_WA_DATA_DIR="/var/lib/trawe-wa/sessions"
export PORT=8787
npm start
```

Put it behind HTTPS (Caddy/Nginx) and keep the port closed to the public.

### Docker

```bash
docker build -t trawe-wa gateway
docker run -d --name trawe-wa -p 8787:8787 \
  -e TRAWE_WA_GATEWAY_TOKEN=... -e TRAWE_WA_ENC_KEY=... \
  -v /var/lib/trawe-wa:/data --restart always trawe-wa
```

### systemd

Copy the folder to `/opt/trawe-wa-gateway`, put the two secrets in
`/etc/trawe-wa.env` (chmod 600), then:

```bash
cp gateway/trawe-wa-gateway.service /etc/systemd/system/
systemctl enable --now trawe-wa-gateway
```

Session files are AES-256-GCM encrypted at rest with `TRAWE_WA_ENC_KEY`.
Losing that key means every agency has to scan the QR again.

## Connect TraWe to it

Set these two server secrets in the TraWe app:

| Secret | Value |
| --- | --- |
| `TRAWE_WA_GATEWAY_URL` | `https://wa-gateway.yourdomain.com` |
| `TRAWE_WA_GATEWAY_TOKEN` | the same random string used above |

Then in TraWe: Settings → WhatsApp → choose **TraWe WhatsApp** → Start / Refresh
QR → scan from the agency's phone (WhatsApp → Linked devices).

## API

All routes need `Authorization: Bearer $TRAWE_WA_GATEWAY_TOKEN`.

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/sessions/:tenantId/start` | start/restart a session, returns QR |
| GET | `/sessions/:tenantId` | status, QR, connected number |
| POST | `/sessions/:tenantId/send` | send a text message |
| POST | `/sessions/:tenantId/logout` | sign the number out |
| DELETE | `/sessions/:tenantId` | delete the stored session |
| GET | `/health` | service + session health (no auth) |

Incoming messages are POSTed to the workspace's TraWe webhook with the
`X-Webhook-Secret` header, in the same shape the CRM inbox already parses.

## Safety behaviour

Gateway side: presence/typing indicators, randomised typing time by message
length, one-at-a-time serial queue, randomised gaps between sends, read
receipts, reconnect with backoff, session restore after restart.

App side (`src/lib/wa-send.server.ts`): hourly/daily caps, three-week warm-up
ramp for new numbers, quiet hours, duplicate-blast detection, and campaigns
blocked on this engine.

## Honest limits

This is an unofficial WhatsApp Web connection. It can disconnect, and WhatsApp
can still restrict numbers that receive spam reports. Do not use it for bulk
marketing or OTP — keep WasenderAPI or the official Cloud API for those.
Review the WhatsApp library's licence and terms risk before production use.
