# Infrastructure

GitOps infrastructure using ArgoCD App-of-Apps pattern.

## Quick Start

### 1. Bootstrap k3s cluster

```bash
# Run setup script (installs k3s, kubectl, helm, k9s)
sudo ./scripts/bootstrap.sh

# Reload shell
source ~/.bashrc
```

### 2. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s
```

### 3. Configure repository access

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "argocd" -f ~/.ssh/argocd -N ""

# Add public key to GitHub: Settings → Deploy keys
cat ~/.ssh/argocd.pub

# Create secret
kubectl create secret generic repo-infrastructure \
  --from-literal=type=git \
  --from-literal=url=git@github.com:<YOUR_ORG>/<YOUR_REPO>.git \
  --from-file=sshPrivateKey=$HOME/.ssh/argocd \
  -n argocd
kubectl label secret repo-infrastructure argocd.argoproj.io/secret-type=repository -n argocd
```

### 4. Deploy

```bash
kubectl apply -f bootstrap/root.yaml
kubectl get applications -n argocd -w
```

## Architecture

```
infrastructure/
├── apps/                     # ArgoCD App-of-Apps
│   ├── values.yaml          # Global configuration (EDIT THIS)
│   └── templates/           # Application manifests
│       ├── services/        # Microservices (ApplicationSet)
│       ├── data/            # PostgreSQL, Redis (ApplicationSet)
│       ├── monitoring/      # Prometheus, Loki, Grafana, Alloy
│       ├── network/         # Ingress, DNS, Tunnels, OAuth2
│       ├── core/            # Storage, Secrets, Operators
│       └── cicd/            # ArgoCD config, Image Updater
├── bootstrap/
│   └── root.yaml            # Entry point (apply this first)
├── charts/                  # Custom Helm charts
├── helm-values/             # Values for upstream charts
│   ├── data/               # postgres-{dev,prd}-defaults.yaml
│   ├── monitoring/         # prometheus, loki, alloy configs
│   └── network/            # ingress, oauth2 configs
├── manifests/              # Raw Kubernetes manifests
└── scripts/
    └── bootstrap.sh        # k3s + tools setup
```

## Components

| Category | Component | Description |
|----------|-----------|-------------|
| **Core** | Longhorn | Distributed storage |
| | External Secrets | Secrets from Doppler |
| | CloudNativePG | PostgreSQL operator |
| | Redis Operator | Redis operator (OT) |
| **Network** | NGINX Ingress | Ingress controller |
| | Cloudflare Tunnel | Public access |
| | Tailscale | Private access |
| | OAuth2 Proxy | Authentication |
| | External DNS | DNS automation |
| **Monitoring** | Prometheus | Metrics |
| | Loki | Logs |
| | Grafana | Dashboards |
| | Alloy | Log collector |
| **CI/CD** | ArgoCD | GitOps |
| | Image Updater | Auto-deploy |

## Configuration

Edit `apps/values.yaml` with your values:

```yaml
spec:
  source:
    repoURL: <INFRASTRUCTURE_REPO_URL>

deploy:
  repoURL: <DEPLOY_REPO_URL>

global:
  servicePrefixes:
    - <SERVICE_PREFIX>          # e.g., myapp (allows myapp-* namespaces)
  cluster: <CLUSTER_NAME>
  domain: <DOMAIN>
  tailnet: <TAILNET_NAME>
  # ... see file for all options
```

## Sync Order

Applications deploy in waves via `argocd.argoproj.io/sync-wave`:

| Wave | Components |
|------|------------|
| 0-9 | Core (secrets, operators) |
| 10-19 | Data (databases) |
| 20-29 | Network (ingress, DNS) |
| 30-39 | Monitoring |
| 100+ | Services |

## Useful Commands

```bash
# Check all applications
kubectl get applications -n argocd

# Sync specific app
kubectl patch application <app> -n argocd --type merge \
  -p '{"operation":{"sync":{}}}'

# Get ArgoCD admin password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath='{.data.password}' | base64 -d

# Watch logs
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-server -f
```

## See Also

- [Adding New Environment](../docs/adding-new-environment.md)
- [Auth0 Setup](../docs/auth0-setup.md)
