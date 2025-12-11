# Tailscale Setup

Tailscale Operator provides private access to cluster services and kubectl via VPN.

> **Docs**: https://tailscale.com/kb/1236/kubernetes-operator

## Prerequisites

- Tailscale account with server joined ([Step 1.1](tailscale-server.md))
- Doppler project with `shared` config ([Step 2.1](doppler.md))

---

## 1. Configure ACL Policy

1. Open [ACL Editor](https://login.tailscale.com/admin/acls)
2. Add or merge these sections:

```json
{
  // Who can assign tags
  "tagOwners": {
    "tag:k8s-operator": ["autogroup:admin"],
    "tag:k8s": ["tag:k8s-operator"],
    "tag:server": ["autogroup:admin"]
  },

  // Network access - NO wildcard, explicit rules only
  "acls": [
    // Admins - full access to everything
    {"action": "accept", "src": ["autogroup:admin"], "dst": ["*:*"]},

    // Server SSH - admins only
    {"action": "accept", "src": ["autogroup:admin"], "dst": ["tag:server:22,2222"]},

    // K8s services - HTTPS for members
    {"action": "accept", "src": ["autogroup:member"], "dst": ["tag:k8s:443"]}
  ],

  "grants": [
    // Admin kubectl access via API Server Proxy
    {
      "src": ["autogroup:admin"],
      "dst": ["tag:k8s-operator"],
      "ip": ["*:*"],
      "app": {
        "tailscale.com/cap/kubernetes": [{
          "impersonate": {"groups": ["system:masters"]}
        }]
      }
    }
  ],

  // Auto-approve Tailscale Services
  "autoApprovers": {
    "services": {
      "tag:k8s": ["tag:k8s"]
    }
  }

  // ... other sections
}
```

<details>
<summary><strong>What each section does</strong></summary>

| Section | Purpose |
|---------|---------|
| `tagOwners` | Defines who can assign tags to devices |
| `acls[0]` | Admins — full access to all devices |
| `acls[1]` | Server SSH — only admins can SSH (port 22, 2222) |
| `acls[2]` | K8s services — members can access HTTPS only |
| `grants` | Admin kubectl access via API Server Proxy |
| `autoApprovers` | Auto-approve Tailscale Services |

**Security model:**
- `autogroup:admin` → full access (SSH, kubectl, all services)
- `autogroup:member` → only HTTPS services (:443)
- Others → no access

</details>

---

## 2. Enable HTTPS

Required for API Server Proxy (kubectl via Tailscale).

1. Open [DNS Settings](https://login.tailscale.com/admin/dns)
2. Scroll to **HTTPS Certificates**
3. Click **Enable HTTPS**

---

## 3. Create OAuth Client

1. Open [OAuth Clients](https://login.tailscale.com/admin/settings/oauth)
2. Click **Generate OAuth client**
3. Select scopes:
   - **Devices: Core** → Write
   - **Auth Keys** → Write
   - **Services** → Write
4. Add tag: `tag:k8s-operator`
5. Click **Generate client**
6. Save Client ID as `<TS_CLIENT_ID>`
7. Add to Doppler: `TS_OAUTH_CLIENT_SECRET`

---

## 4. Get Tailnet Name

Find in [Machines](https://login.tailscale.com/admin/machines) — shown in hostnames (e.g., `server.tail123456.ts.net`)

> **Note**: Want to change tailnet name? Do it now — see [Tailscale Server Setup](tailscale-server.md).

Save as `<TAILNET_NAME>` (just the `tail123456` part).

---

## Troubleshooting

<details>
<summary><strong>Operator not joining tailnet</strong></summary>

```bash
kubectl get secret tailscale-oauth -n tailscale -o yaml
kubectl logs -n tailscale -l app.kubernetes.io/name=tailscale-operator
```

Check [Machines](https://login.tailscale.com/admin/machines) for `tailscale-operator` with `tag:k8s-operator`.

</details>

<details>
<summary><strong>kubectl access denied</strong></summary>

1. Verify HTTPS enabled in [DNS settings](https://login.tailscale.com/admin/dns)
2. Check ACL grants include your user/group
3. Verify `apiServerProxyConfig.mode: "true"` in operator values

</details>

<details>
<summary><strong>Service "Pending approval"</strong></summary>

Add `autoApprovers` to ACL (see [step 1](#1-configure-acl-policy)).

</details>

<details>
<summary><strong>Ingress not appearing in Services</strong></summary>

Check [Services](https://login.tailscale.com/admin/services) — ingress should appear as `ts-ingress-0`, `ts-ingress-1` with `tag:k8s`.

```bash
kubectl get pods -n tailscale
kubectl logs -n tailscale -l app.kubernetes.io/name=tailscale-operator
```

</details>
