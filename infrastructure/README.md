# Infrastructure

GitOps infrastructure using ArgoCD App-of-Apps pattern.

## Prerequisites

### Hardware
- Server with 4+ CPU cores, 8+ GB RAM
- SSH access

## Setup Overview

```
1. Server Setup         → Tailscale SSH, k3s bootstrap
2. Configure Services   → Doppler (+ K8s secrets), Cloudflare, Auth0, etc.
3. ArgoCD Bootstrap     → Install ArgoCD, SSH keys
4. Configuration        → Edit values.yaml
5. Deploy               → Apply root.yaml
6. Post-Setup           → Verify access
```

> **Recommendation**: Create a dedicated email (e.g., `infra@yourcompany.com`) for all infrastructure accounts. This acts as a super admin owner and simplifies team access management.

---

## Step 1: Server Setup

### 1.1 Tailscale Server

Join server to tailnet → [Setup Guide](../docs/setup/tailscale-server.md)

> **Note**: Tailscale SSH is optional but highly recommended — it allows secure SSH access from anywhere without exposing port 22.

### 1.2 Install k3s and Tools

SSH to your server and run the bootstrap script:

```bash
curl -fsSL https://raw.githubusercontent.com/mshykhov/gitops-platform/master/infrastructure/scripts/bootstrap.sh | sudo bash
```

This installs k3s, configures kubeconfig, and installs dependencies (open-iscsi for Longhorn).

---

## Step 2: Configure External Services

Follow each guide and add the required secrets to Doppler `shared` config.

### 2.1 Doppler (required first)

Secrets management → [Setup Guide](../docs/setup/doppler.md)

**Setup:** Create account → Create project → Create configs (`shared`, `dev`, `prd`) → Generate service tokens → Create K8s secrets

### 2.2 Cloudflare

**Tunnel & DNS** → [Setup Guide](../docs/setup/cloudflare.md)

**Setup:** Account → Domain → Tunnel (CLI) → API token

**Placeholders:** `<CF_TUNNEL_ID>`, `<DOMAIN>`

**Doppler:** `CF_TUNNEL_CREDENTIALS`, `CF_API_TOKEN`

---

**R2 Storage** → [Setup Guide](../docs/setup/cloudflare-r2.md)

**Setup:** Create bucket → Create API token → Get account ID

**Placeholders:** `<CF_ACCOUNT_ID>`

**Doppler:** `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`

### 2.3 Tailscale Operator

ACL policy, OAuth client → [Setup Guide](../docs/setup/tailscale.md)

**Setup:** ACL policy → Enable HTTPS → Create OAuth client

**Placeholders:** `<TAILNET_NAME>`, `<TS_CLIENT_ID>`

**Doppler:** `TS_OAUTH_CLIENT_SECRET`

### 2.4 Auth0

**oauth2-proxy** (internal services) → [Setup Guide](../docs/setup/auth0-oauth2-proxy.md)

**Setup:** Create tenant → Create application → Configure URLs → Create Action for groups

**Placeholders:** `<AUTH0_DOMAIN>`, `<AUTH0_CLIENT_ID>`, `<AUTH0_GROUPS_CLAIM>`

**Doppler:** `AUTH0_CLIENT_SECRET`

---

**Applications** (SPA/API) → [Setup Guide](../docs/setup/auth0-applications.md)

**Setup:** Create API → Create SPA application → Configure URLs

**Placeholders:** `<AUTH0_AUDIENCE>`

**Doppler:** `AUTH0_CLIENT_SECRET` (same as oauth2-proxy)

### 2.5 Docker Hub

Access token for pulling images (avoids rate limits).

1. [Create account](https://hub.docker.com/signup) or login
2. Go to [Account Settings → Personal access tokens](https://hub.docker.com/settings/security)
3. Click **Generate new token**
4. Description: `k8s-pull`, Access: **Read-only**
5. Click **Generate** and copy token

**Placeholders:** `<DOCKERHUB_USERNAME>` — your Docker Hub username

**Doppler:** `DOCKERHUB_PULL_TOKEN`

### 2.6 Telegram (alerting)

Receive alerts from Prometheus/Alertmanager and deploy notifications from ArgoCD.

[Setup Guide](../docs/setup/telegram.md)

**Setup:** Create bot → Create group with topics → Get chat ID and topic IDs

**Placeholders:**
- `<TELEGRAM_CHAT_ID>` — group chat ID (e.g., `-1001234567890`)
- `<TELEGRAM_TOPIC_CRITICAL>` — topic ID for critical alerts
- `<TELEGRAM_TOPIC_WARNING>` — topic ID for warnings
- `<TELEGRAM_TOPIC_INFO>` — topic ID for info
- `<TELEGRAM_TOPIC_DEPLOYS>` — topic ID for deploy notifications

**Doppler:** `TELEGRAM_BOT_TOKEN`

### 2.7 Generate Random Secrets

Generate and add to Doppler `shared`:

1. **OAUTH2_PROXY_COOKIE_SECRET** — run: `openssl rand -base64 32`
2. **OAUTH2_PROXY_REDIS_PASSWORD** — run: `openssl rand -base64 24`

### Doppler Secrets Checklist (10 secrets)

After completing all steps, verify `shared` config contains:

1. `CF_TUNNEL_CREDENTIALS`
2. `CF_API_TOKEN`
3. `S3_ACCESS_KEY_ID`
4. `S3_SECRET_ACCESS_KEY`
5. `TS_OAUTH_CLIENT_SECRET`
6. `AUTH0_CLIENT_SECRET`
7. `DOCKERHUB_PULL_TOKEN`
8. `TELEGRAM_BOT_TOKEN`
9. `OAUTH2_PROXY_COOKIE_SECRET`
10. `OAUTH2_PROXY_REDIS_PASSWORD`

---

## Step 3: ArgoCD Bootstrap

### 3.1 Create Infrastructure Repository

1. Fork or copy this `infrastructure` directory to a new GitHub repository
2. Name it (e.g., `mshykhov/smhomelab-infrastructure`)
3. This will be your GitOps source of truth

Save as `<GITHUB_USER>/<INFRASTRUCTURE_REPO>` (e.g., `mshykhov/smhomelab-infrastructure`)

### 3.2 Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s
```

### 3.3 Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "argocd-infrastructure" -f ~/.ssh/argocd-infrastructure -N ""
cat ~/.ssh/argocd-infrastructure.pub
```

### 3.4 Add Deploy Key to GitHub

1. Go to your infrastructure repo → **Settings** → **Deploy keys**
2. Click **Add deploy key**
3. Title: `argocd-infrastructure`
4. Key: paste output from `cat ~/.ssh/argocd-infrastructure.pub`
5. Leave "Allow write access" unchecked (read-only is sufficient)
6. Click **Add key**

### 3.5 Create Repository Secret

```bash
kubectl create secret generic repo-infrastructure \
  --from-literal=type=git \
  --from-literal=url=git@github.com:<GITHUB_USER>/<INFRASTRUCTURE_REPO>.git \
  --from-file=sshPrivateKey=$HOME/.ssh/argocd-infrastructure \
  -n argocd

kubectl label secret repo-infrastructure argocd.argoproj.io/secret-type=repository -n argocd
```

### 3.6 Create Deploy Repository (for applications)

The deploy repository contains Helm charts for your applications (services, databases).

1. Copy the `deploy` directory from this project to a new GitHub repository
2. Name it (e.g., `mshykhov/smhomelab-deploy`)

Save as `<GITHUB_USER>/<DEPLOY_REPO>` (e.g., `mshykhov/smhomelab-deploy`)

### 3.7 Generate SSH Key for Deploy Repo

```bash
ssh-keygen -t ed25519 -C "argocd-deploy" -f ~/.ssh/argocd-deploy -N ""
cat ~/.ssh/argocd-deploy.pub
```

### 3.8 Add Deploy Key to GitHub

1. Go to your deploy repo → **Settings** → **Deploy keys**
2. Click **Add deploy key**
3. Title: `argocd-deploy`
4. Key: paste output from `cat ~/.ssh/argocd-deploy.pub`
5. **Check "Allow write access"** (required for ArgoCD Image Updater)
6. Click **Add key**

### 3.9 Create Deploy Repository Secret

```bash
kubectl create secret generic repo-deploy \
  --from-literal=type=git \
  --from-literal=url=git@github.com:<GITHUB_USER>/<DEPLOY_REPO>.git \
  --from-file=sshPrivateKey=$HOME/.ssh/argocd-deploy \
  -n argocd

kubectl label secret repo-deploy argocd.argoproj.io/secret-type=repository -n argocd
```

> **Note**: The deploy repo is optional if you only need infrastructure. Skip steps 3.6-3.9 if not deploying custom applications.

---

## Step 4: Configuration

Replace placeholders in configuration files with values collected in Step 2.

### `bootstrap/root.yaml`

| Placeholder | Description |
|-------------|-------------|
| `<INFRASTRUCTURE_REPO_URL>` | `git@github.com:<GITHUB_USER>/<INFRASTRUCTURE_REPO>.git` |

### `apps/values.yaml`

| Placeholder | Source (Step 2) |
|-------------|-----------------|
| `<INFRASTRUCTURE_REPO_URL>` | Step 3.1 |
| `<DEPLOY_REPO_URL>` | `git@github.com:<GITHUB_USER>/<DEPLOY_REPO>.git` |
| `<SERVICE_PREFIX>` | Your app prefix (e.g., `myapp`) |
| `<CLUSTER_NAME>` | Cluster identifier (e.g., `k3s-home`) |
| `<DOMAIN>` | 2.2 Cloudflare |
| `<TAILNET_NAME>` | 2.3 Tailscale |
| `<TS_CLIENT_ID>` | 2.3 Tailscale |
| `<AUTH0_DOMAIN>` | 2.4 Auth0 |
| `<AUTH0_CLIENT_ID>` | 2.4 Auth0 |
| `<AUTH0_GROUPS_CLAIM>` | 2.4 Auth0 |
| `<DOCKERHUB_USERNAME>` | 2.5 Docker Hub |
| `<CF_TUNNEL_ID>` | 2.2 Cloudflare |
| `<CF_ACCOUNT_ID>` | 2.2 R2 Storage |
| `<TELEGRAM_CHAT_ID>` | 2.6 Telegram |
| `<TELEGRAM_TOPIC_*>` | 2.6 Telegram |

### Deploy Repository (optional)

For user-facing applications:

| Placeholder | Source |
|-------------|--------|
| `<AUTH0_AUDIENCE>` | 2.4 Auth0 Applications |

---

## Step 5: Deploy

Clone repo to server and apply:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/argocd-infrastructure
git clone git@github.com:<GITHUB_USER>/<INFRASTRUCTURE_REPO>.git
cd <INFRASTRUCTURE_REPO>
kubectl apply -f bootstrap/root.yaml
```

Watch deployment:

```bash
kubectl get applications -n argocd -w
```

Applications deploy in waves (0-9: core, 10-19: data, 20-29: network, 30-39: monitoring, 100+: services).

---

## Step 6: Post-Setup

### 6.1 Monitor Deployment (port-forward)

Initially, use port-forward to access ArgoCD UI and monitor deployment progress:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080 (anonymous access enabled)
```

Wait for all applications to sync (especially: `tailscale-operator`, `oauth2-proxy`, `external-secrets`).

<details>
<summary><strong>Troubleshooting</strong></summary>

- **App stuck in "Progressing"** — check Events tab for errors
- **Sync failed** — check app details for error messages
- **ImagePullBackOff** — check Doppler secrets (DOCKERHUB_PULL_TOKEN)
- **External secrets not syncing** — check ClusterSecretStore: `kubectl get clustersecretstores`

</details>

### 6.2 Configure kubectl via Tailscale

After `tailscale-operator` is synced:

```bash
tailscale configure kubeconfig tailscale-operator
kubectl get nodes
```

### 6.3 Access ArgoCD via Tailscale

After `oauth2-proxy` is synced, open `https://argocd.<TAILNET_NAME>.ts.net`

> **Note**: Requires Auth0 configured in [Step 2.4](#24-auth0). Login with your Auth0 account.

---

## Service Environment Variables

Application environment variables are defined in the **deploy repository**:

```
deploy/services/<service-name>/
├── values-dev.yaml    # Dev environment config
└── values-prd.yaml    # Production environment config
```

Each service has its own directory with environment-specific values files containing:
- Environment variables (`env:`)
- Resource limits
- Replica counts
- Feature flags

---

## Architecture

```
infrastructure/
├── apps/                     # ArgoCD App-of-Apps
│   ├── values.yaml          # Global configuration
│   └── templates/           # Application manifests
├── bootstrap/root.yaml      # Entry point
├── charts/                  # Custom Helm charts
├── helm-values/             # Values for upstream charts
├── manifests/               # Raw Kubernetes manifests
└── docs/                    # Documentation
    ├── setup/               # Setup guides
    └── reference/           # Reference docs
```

---

## Documentation

| Document | Description |
|----------|-------------|
| **Setup Guides** | |
| [Tailscale Server](../docs/setup/tailscale-ssh.md) | Server setup + optional SSH |
| [Doppler Setup](../docs/setup/doppler.md) | Secrets management configuration |
| [Tailscale Operator](../docs/setup/tailscale.md) | ACL, OAuth, kubectl access |
| [Auth0 oauth2-proxy](../docs/setup/auth0-oauth2-proxy.md) | Authentication for internal services |
| [Auth0 Applications](../docs/setup/auth0-applications.md) | Auth0 for UI/API applications |
| [Cloudflare Setup](../docs/setup/cloudflare.md) | Tunnel, DNS, R2 storage |
| [Telegram Setup](../docs/setup/telegram.md) | Alerts bot configuration |
| [GitHub Actions](../docs/setup/github-actions.md) | CI/CD secrets setup |
| **Reference** | |
| [Secrets Reference](../docs/reference/secrets.md) | All secrets and configuration |
| **Operations** | |
| [Adding Environment](../docs/operations/adding-new-environment.md) | Add new environment (stg, etc.) |

---

## Useful Commands

```bash
# Check applications
kubectl get applications -n argocd

# Sync app
kubectl patch application <app> -n argocd --type merge -p '{"operation":{"sync":{}}}'

# ArgoCD password
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath='{.data.password}' | base64 -d

# Check secrets
kubectl get clustersecretstores
kubectl get externalsecrets -A
```

---

## Setup Checklist

### External Services
- [ ] **Doppler**: Account, project, configs (shared/dev/prd), secrets, service tokens
- [ ] **Tailscale**: ACL policy, OAuth client, HTTPS enabled
- [ ] **Auth0**: Application, callback URLs, Action for groups
- [ ] **Cloudflare**: Domain, Tunnel (credentials.json), API token, R2 buckets
- [ ] **Docker Hub**: Access token
- [ ] **Telegram**: Bot and group with topics

### Cluster
- [ ] k3s installed (without traefik, servicelb)
- [ ] open-iscsi installed
- [ ] ArgoCD installed
- [ ] Repository SSH key configured

### Configuration
- [ ] `apps/values.yaml` edited
- [ ] Doppler token secrets created

### Deployment
- [ ] `bootstrap/root.yaml` applied
- [ ] All applications synced
- [ ] kubectl via Tailscale working
- [ ] ArgoCD UI accessible
- [ ] Cloudflare routes configured
