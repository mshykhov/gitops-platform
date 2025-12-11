# Cloudflare Setup

Cloudflare provides public access via Tunnel and DNS automation.

> **Docs**: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

## Prerequisites

- Doppler project with `shared` config ([Step 2.1](doppler.md))

---

## 1. Create Account & Add Domain

<details>
<summary><strong>New to Cloudflare? Click to expand</strong></summary>

### Create Account

1. Go to [cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter email and password
3. Verify email

</details>

<details>
<summary><strong>Need to register or add a domain? Click to expand</strong></summary>

### Option A: Register New Domain

1. [Domain Registration](https://dash.cloudflare.com/?to=/:account/domains/register) → Search and register
2. Complete purchase

> **Tip**: Cloudflare Registrar offers domains at cost — `.com` ~$9.77/year, `.dev` ~$12/year

### Option B: Add Existing Domain

1. [Add a site](https://dash.cloudflare.com/?to=/:account/add-site)
2. Enter your domain
3. Select **Free** plan
4. Update nameservers at your current registrar to Cloudflare's

</details>

---

## 2. Create Tunnel (CLI)

Locally-managed tunnel allows GitOps control over routes via config.yaml.

> **Docs**: [Create local tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-local-tunnel/)

### 2.1 Install cloudflared

```bash
# macOS
brew install cloudflared

# Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
```

### 2.2 Login & Create Tunnel

```bash
cloudflared tunnel login
# Opens browser → login → select domain → creates ~/.cloudflared/cert.pem

cloudflared tunnel create k8s-tunnel
# Output: Tunnel credentials written to ~/.cloudflared/<UUID>.json

cloudflared tunnel list
# Verify tunnel created, note the UUID
```

### 2.3 Encode Credentials for Doppler

```bash
cat ~/.cloudflared/<UUID>.json | base64 -w0
```

### 2.4 Cleanup Local Files

After saving to Doppler, delete local credentials:

```bash
rm ~/.cloudflared/cert.pem
rm ~/.cloudflared/<UUID>.json
```

> To manage tunnels later, run `cloudflared tunnel login` again

**Result:** Tunnel UUID → save as `<CF_TUNNEL_ID>`, base64 credentials → add `CF_TUNNEL_CREDENTIALS` to Doppler

---

## 3. Create API Token

For External-DNS (automatic DNS record management):

1. [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. Select **Create custom token**
3. Configure:
   - **Token name**: `external-dns`
   - **Permissions**: Zone → DNS → Edit
   - **Zone Resources**: Include → Specific zone → *your domain*
4. Click **Continue to summary** → **Create Token**
5. Copy token (shown only once!) → add `CF_API_TOKEN` to Doppler

---

## Troubleshooting

<details>
<summary><strong>Tunnel not connecting</strong></summary>

```bash
kubectl logs -n cloudflare -l app=cloudflared -f
kubectl get secret tunnel-credentials -n cloudflare
```

Check [Zero Trust → Tunnels](https://one.dash.cloudflare.com/networks/tunnels) — status should be HEALTHY.

</details>

<details>
<summary><strong>DNS not updating</strong></summary>

```bash
kubectl logs -n external-dns -l app.kubernetes.io/name=external-dns
```

Verify `CF_API_TOKEN` has Zone:DNS:Edit permission in [API Tokens](https://dash.cloudflare.com/profile/api-tokens).

</details>

