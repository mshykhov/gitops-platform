# Secrets Reference

All secrets required for the platform, organized by Doppler config.

## Doppler Shared Config

Infrastructure secrets used by multiple components.

| Secret | Description | How to Get | Used By |
|--------|-------------|------------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token for deploy notifications | @BotFather → /newbot | Argo CD Notifications |
| `AUTHENTIK_SECRET_KEY` | Authentik signing key | Generate a long random value | Authentik |
| `AUTHENTIK_BOOTSTRAP_PASSWORD` | Initial administrator password | Generate a unique password | Authentik |
| `AUTHENTIK_BOOTSTRAP_EMAIL` | Initial administrator email | Choose the operator address | Authentik |
| `CF_TUNNEL_CREDENTIALS` | Cloudflare Tunnel credentials (base64 JSON) | `cat credentials.json \| base64 -w0` | cloudflared |
| `CF_API_TOKEN` | Cloudflare API token (Zone:DNS:Edit) | Cloudflare → API Tokens | External DNS |
| `S3_ACCESS_KEY_ID` | S3/R2 access key | Cloudflare R2 → API Tokens | CNPG backups, Velero |
| `S3_SECRET_ACCESS_KEY` | S3/R2 secret key | Cloudflare R2 → API Tokens | CNPG backups, Velero |
| `DOCKERHUB_PULL_TOKEN` | Docker Hub access token (read-only) | Docker Hub → Security | Image pull secrets |
| `TS_OAUTH_CLIENT_SECRET` | Tailscale OAuth client secret | Tailscale → Settings → OAuth | Tailscale Operator |

## Doppler Dev/Prd Configs

Application-specific secrets per environment.

| Secret | Description | Used By |
|--------|-------------|---------|
| `<SERVICE>_REDIS_PASSWORD` | Redis password per service | Redis instances |

Example: `MYAPP_API_REDIS_PASSWORD` for service `myapp-api`.

## Generate Secrets

```bash
# Authentik signing key
openssl rand -base64 60

# Redis password
openssl rand -base64 24

# Cloudflare Tunnel credentials (base64)
cat credentials.json | base64 -w0
```

## Values.yaml Non-Secret Configuration

These are configured in `infrastructure/apps/values.yaml`, not in Doppler:

| Parameter | Example | Description |
|-----------|---------|-------------|
| `global.tailnet` | `tail123456` | Tailscale tailnet name |
| `global.domain` | `example.com` | Public domain |
| `global.tailscale.clientId` | `kXXXXX...` | Tailscale OAuth Client ID |
| `global.components.authentik` | `false` | Enables the Authentik Application and credentials |
| `authentik.host` in the protected-services chart | `sso.example.com` | Browser-reachable Authentik host used by ForwardAuth redirects |
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
