#!/usr/bin/env bash
# TraWe WhatsApp gateway — one-shot installer for Ubuntu/Debian.
# Usage:  sudo bash install.sh
set -euo pipefail

APP_DIR="/opt/trawe-wa"
PORT="${PORT:-8088}"

echo "==> Installing Node.js 20 (if missing)"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "==> Copying gateway to $APP_DIR"
mkdir -p "$APP_DIR/sessions"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -r "$SRC_DIR"/*.js "$SRC_DIR"/package.json "$APP_DIR"/
cd "$APP_DIR"
npm install --omit=dev

ENV_FILE="$APP_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "==> Generating secrets"
  TOKEN="$(openssl rand -hex 32)"
  ENC_KEY="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<EOF
PORT=$PORT
TRAWE_WA_GATEWAY_TOKEN=$TOKEN
TRAWE_WA_ENC_KEY=$ENC_KEY
TRAWE_WA_SESSION_DIR=$APP_DIR/sessions
EOF
  chmod 600 "$ENV_FILE"
fi

echo "==> Installing service"
cat > /etc/systemd/system/trawe-wa-gateway.service <<EOF
[Unit]
Description=TraWe WhatsApp Gateway
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now trawe-wa-gateway
sleep 2
systemctl --no-pager --lines=15 status trawe-wa-gateway || true

# open firewall if ufw is active
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow "$PORT"/tcp || true
fi
# Oracle/Ubuntu images often block everything in iptables
if command -v iptables >/dev/null 2>&1; then
  iptables -I INPUT -p tcp --dport "$PORT" -j ACCEPT || true
  command -v netfilter-persistent >/dev/null 2>&1 && netfilter-persistent save || true
fi

IP="$(curl -fsS ifconfig.me || echo YOUR_SERVER_IP)"
echo
echo "============================================"
echo " GATEWAY URL   : http://$IP:$PORT"
echo " GATEWAY TOKEN : $(grep TRAWE_WA_GATEWAY_TOKEN "$ENV_FILE" | cut -d= -f2)"
echo "============================================"
echo "Keep the token private. Backup $ENV_FILE — losing the key means re-scanning all QRs."
