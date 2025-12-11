# Doppler Setup

Doppler is used for secrets management with External Secrets Operator.

> **Official Docs**: https://docs.doppler.com

## Prerequisites

- **Steps 1-4**: None (can do before server setup)
- **Step 5**: k8s cluster running (after Step 1 in main README)

---

## 1. Create Account

1. Go to [doppler.com](https://dashboard.doppler.com/register)
2. Sign up (GitHub SSO available)
3. Developer plan (free):
   - Unlimited projects
   - Unlimited secrets
   - 5 environments per project

## 2. Create Project

1. Dashboard → **+ Create Project**
2. Name: `<your-project-name>`

## 3. Create Configs

Create these configs in your project:

| Config | Purpose |
|--------|---------|
| `shared` | Infrastructure secrets (auth, tunnels, backups) |
| `dev` | Application secrets for dev environment |
| `prd` | Application secrets for prd environment |

## 4. Generate Service Tokens

For each config, generate a Service Token:

1. Dashboard → Project → Config (e.g., `shared`)
2. **Access** → **Service Tokens** → **+ Generate**
3. Name: `k8s-eso-<config>` (e.g., `k8s-eso-shared`)
4. Click **Generate**
5. **Save token immediately** (shown only once!)

Token format: `dp.st.<config>.XXXX...`

You need 3 tokens:
- `dp.st.shared.XXXX` — for `shared` config
- `dp.st.dev.XXXX` — for `dev` config
- `dp.st.prd.XXXX` — for `prd` config

## 5. Create K8s Secrets

Create secrets with Doppler Service Tokens (space prefix prevents bash history):

```bash
kubectl create namespace external-secrets

 kubectl create secret generic doppler-token-shared \
  --namespace external-secrets \
  --from-literal=dopplerToken="dp.st.shared.XXXX"

 kubectl create secret generic doppler-token-dev \
  --namespace external-secrets \
  --from-literal=dopplerToken="dp.st.dev.XXXX"

 kubectl create secret generic doppler-token-prd \
  --namespace external-secrets \
  --from-literal=dopplerToken="dp.st.prd.XXXX"

# namespace/external-secrets created
# secret/doppler-token-shared created
# secret/doppler-token-dev created
# secret/doppler-token-prd created
```

---

## Architecture

```
Doppler Project
├── shared/              → ClusterSecretStore: doppler-shared
│   ├── AUTH0_CLIENT_SECRET
│   ├── CF_TUNNEL_CREDENTIALS
│   └── ...
├── dev/                 → ClusterSecretStore: doppler-dev
│   └── <SERVICE>_REDIS_PASSWORD
└── prd/                 → ClusterSecretStore: doppler-prd
    └── <SERVICE>_REDIS_PASSWORD
```

## Troubleshooting

### "SecretStore not ready"

1. Check Doppler Service Token is valid
2. Check K8s secret exists:
   ```bash
   kubectl get secret doppler-token-shared -n external-secrets
   ```
3. Check External Secrets Operator logs:
   ```bash
   kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets
   ```

### Secret not syncing

1. Check ExternalSecret status:
   ```bash
   kubectl get externalsecret -A
   kubectl describe externalsecret <name> -n <namespace>
   ```
2. Verify secret key exists in Doppler config
