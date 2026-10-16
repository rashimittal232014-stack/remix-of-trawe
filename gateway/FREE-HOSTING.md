# Running TraWe WhatsApp for ₹0

The service needs a machine that stays switched on. Here are the genuinely free ways
to get one, best first.

## Option A — Oracle Cloud "Always Free" (recommended, ₹0 forever)

Oracle gives a permanent free virtual machine (not a trial):
4 CPU / 24 GB RAM ARM, or a small AMD one. It never expires.

1. Sign up at cloud.oracle.com (a card is asked only for identity check; the
   Always Free machines are never charged). Pick region **India South (Hyderabad)**
   or **India West (Mumbai)**.
2. Create a Compute Instance:
   - Image: **Ubuntu 24.04**
   - Shape: **VM.Standard.A1.Flex** — 2 CPU, 6 GB RAM is plenty (still free)
   - Download the SSH key it offers.
3. In *Networking > Virtual Cloud Network > Security List*, add an **Ingress Rule**
   allowing TCP port **8088** from 0.0.0.0/0.
4. Connect: `ssh -i your-key.key ubuntu@YOUR_SERVER_IP`
5. Run the installer (below).

If Oracle says "out of capacity" for the ARM shape, retry after a few hours or
pick the AMD Always Free shape (1 CPU / 1 GB) — it also works.

## Option B — Google Cloud Always Free e2-micro (₹0)

Same steps, but the free machine only exists in US regions (us-central1 etc.),
so WhatsApp connections are a bit slower from India. Free forever, 1 GB RAM.

## Option C — An old laptop or desktop at home (₹0)

Any spare Windows/Linux machine that can stay plugged in works:
- Install Ubuntu (or use Windows + WSL), run the installer below.
- Expose it safely with a free Cloudflare Tunnel:
  ```bash
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  cloudflared tunnel --url http://localhost:8088
  ```
  It prints a public https address — that is your gateway URL. No fixed IP, no
  port forwarding, no cost. (For a permanent address, create a named tunnel on
  your trawe.in Cloudflare account — also free.)

Downside: if the power or internet goes off at home, connections drop until it
comes back.

## What is NOT free / not possible

- Lovable Cloud, Vercel, Netlify, Cloudflare Workers: they switch off between
  requests, so a live WhatsApp session cannot stay open there.
- Render / Railway free tiers: they sleep or expire, sessions break daily.

---

## The installer (same for every option)

On the server, as root:

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR-REPO/main/gateway/install.sh | bash
```

Or copy the `gateway/` folder to the server and run `bash install.sh`.

It installs Node, creates `/opt/trawe-wa`, generates your password + encryption
key, and starts the service on boot.

At the end it prints:

```
GATEWAY URL   : http://YOUR_IP:8088
GATEWAY TOKEN : <long password>
```

Send those two to me (the token privately) and I save them securely — the QR
screen then goes live for every workspace at once.
