#!/bin/sh
set -e

# Generate runtime config from environment variables
# This script runs in /docker-entrypoint.d/ before nginx starts

cat > /usr/share/nginx/html/config.js << EOF
window.__CONFIG__ = {
  API_URL: "${API_URL:-https://api.untrustedonline.org}",
  AUTH0_DOMAIN: "${AUTH0_DOMAIN:-}",
  AUTH0_CLIENT_ID: "${AUTH0_CLIENT_ID:-}",
  AUTH0_AUDIENCE: "${AUTH0_AUDIENCE:-}",
};
EOF

echo "Runtime config generated:"
cat /usr/share/nginx/html/config.js
