# Secrets Reference

All secrets required for the platform, organized by Doppler config.

## Doppler Shared Config

Infrastructure secrets used by multiple components.

| Secret | Description | How to Get | Used By |
|--------|-------------|------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for alerts | @BotFather → /newbot | ArgoCD Notifications, Alertmanager |
| `AUTH0_CLIENT_SECRET` | Auth0 application secret | Auth0 → Applications → Settings | OAuth2 Proxy |
| `CF_TUNNEL_CREDENTIALS` | Cloudflare Tunnel credentials (base64 JSON) | `cat credentials.json \| base64 -w0` | cloudflared |
| `CF_API_TOKEN` | Cloudflare API token (Zone:DNS:Edit) | Cloudflare → API Tokens | External DNS |
| `S3_ACCESS_KEY_ID` | S3/R2 access key | Cloudflare R2 → API Tokens | CNPG backups, Velero |
| `S3_SECRET_ACCESS_KEY` | S3/R2 secret key | Cloudflare R2 → API Tokens | CNPG backups, Velero |
| `DOCKERHUB_PULL_TOKEN` | Docker Hub access token (read-only) | Docker Hub → Security | Image pull secrets |
| `OAUTH2_PROXY_COOKIE_SECRET` | Random 32-byte secret for sessions | `openssl rand -base64 32` | OAuth2 Proxy |
| `OAUTH2_PROXY_REDIS_PASSWORD` | Redis password for OAuth2 Proxy sessions | `openssl rand -base64 24` | OAuth2 Proxy Redis |
| `TS_OAUTH_CLIENT_SECRET` | Tailscale OAuth client secret | Tailscale → Settings → OAuth | Tailscale Operator |

## Doppler Dev/Prd Configs

Application-specific secrets per environment.

| Secret | Description | Used By |
|--------|-------------|---------|
| `<SERVICE>_REDIS_PASSWORD` | Redis password per service | Redis instances |

Example: `MYAPP_API_REDIS_PASSWORD` for service `myapp-api`.

## Generate Secrets

```bash
# OAuth2 Proxy cookie secret (32 bytes)
openssl rand -base64 32

# Redis password
openssl rand -base64 24

# Cloudflare Tunnel credentials (base64)
cat credentials.json | base64 -w0
```

## Values.yaml Non-Secret Configuration

These are configured in `apps/values.yaml`, NOT in Doppler:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `global.tailnet` | `tail123456` | Tailscale tailnet name |
| `global.domain` | `example.com` | Public domain |
| `global.tailscale.clientId` | `kXXXXX...` | Tailscale OAuth Client ID |
| `global.auth0.domain` | `dev-xxx.us.auth0.com` | Auth0 domain |
| `global.auth0.clientId` | `XXXXX...` | Auth0 Application Client ID |
| `global.auth0.groupsClaim` | `https://myapp` | Auth0 groups claim namespace |
| `global.dockerhub.username` | `yourusername` | Docker Hub username |
| `global.cloudflare.tunnelId` | `xxxxxxxx-xxxx...` | Cloudflare Tunnel UUID |
| `global.telegram.chatId` | `-100XXXXXXXXXX` | Telegram group chat ID |
| `global.s3.endpoint` | `https://XXX.r2.cloudflarestorage.com` | S3 endpoint URL |

## Kubernetes Manual Secrets

These secrets must be created manually before deployment:

```bash
# Create namespace
kubectl create namespace external-secrets

# Doppler Service Tokens
kubectl create secret generic doppler-token-shared \
  --namespace external-secrets \
  --from-literal=dopplerToken="dp.st.shared.XXXX"

kubectl create secret generic doppler-token-dev \
  --namespace external-secrets \
  --from-literal=dopplerToken="dp.st.dev.XXXX"

kubectl create secret generic doppler-token-prd \
  --namespace external-secrets \
  --from-literal=dopplerToken="dp.st.prd.XXXX"
```

## Secret Flow

```
Doppler (cloud)
     │
     │ Service Token
     ▼
K8s Secret (doppler-token-*)
     │
     │ ClusterSecretStore
     ▼
External Secrets Operator
     │
     │ ExternalSecret
     ▼
K8s Secret (application-ready)
     │
     ▼
Application Pod
```

## ClusterSecretStores

| Name | Doppler Config | K8s Secret |
|------|----------------|------------|
| `doppler-shared` | shared | `doppler-token-shared` |
| `doppler-dev` | dev | `doppler-token-dev` |
| `doppler-prd` | prd | `doppler-token-prd` |

## Verification

```bash
# Check ClusterSecretStores are ready
kubectl get clustersecretstores

# Check ExternalSecrets sync status
kubectl get externalsecrets -A

# Check specific secret content (base64 decoded)
kubectl get secret <name> -n <namespace> -o jsonpath='{.data.<key>}' | base64 -d
```
