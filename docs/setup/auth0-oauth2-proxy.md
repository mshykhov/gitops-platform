# Auth0 Setup for oauth2-proxy

Auth0 provides authentication for internal services via oauth2-proxy.

> **Docs**: https://auth0.com/docs

## Prerequisites

- Tailscale Operator configured ([Step 2.3](tailscale.md))
- Doppler project with `shared` config ([Step 2.1](doppler.md))

---

## 1. Create Auth0 Account

1. Go to [auth0.com/signup](https://auth0.com/signup)
2. Create tenant (e.g., `myproject-dev`)
3. Note your domain (e.g., `myproject-dev.us.auth0.com`)

### Custom Domain (optional)

Use your own domain instead of `*.auth0.com`:

1. **Auth0**: [Settings](https://manage.auth0.com/dashboard) → **Custom Domains** → Add domain (e.g., `login.example.com`)
2. Auth0 shows CNAME target (e.g., `xxx.edge.tenants.us.auth0.com`)
3. **Cloudflare DNS** → Add record:
   - **Type**: `CNAME`
   - **Name**: `login`
   - **Target**: value from Auth0
   - **Proxy status**: **DNS only** (grey cloud, not orange!)
4. Wait 1-5 min → click **Verify** in Auth0

> **Note**: If you deleted and recreated the domain, wait up to 4 hours before verification works.

Save your domain as `<AUTH0_DOMAIN>`:
- With custom domain: `login.example.com`
- Without: `myproject-dev.us.auth0.com`

---

## 2. Create Application

1. [Applications](https://manage.auth0.com/dashboard) → **Applications** → **Create Application**
2. Name: `oauth2-proxy`
3. Type: **Regular Web Application**
4. Click **Create**
5. Save Client ID as `<AUTH0_CLIENT_ID>`
6. Add to Doppler: `AUTH0_CLIENT_SECRET`

---

## 3. Configure Application URLs

In Application **Settings** → **Application URIs**:

| Setting | Value |
|---------|-------|
| Allowed Callback URLs | `https://argocd.<TAILNET_NAME>.ts.net/oauth2/callback, https://grafana.<TAILNET_NAME>.ts.net/oauth2/callback, https://longhorn.<TAILNET_NAME>.ts.net/oauth2/callback` |
| Allowed Logout URLs | `https://argocd.<TAILNET_NAME>.ts.net, https://grafana.<TAILNET_NAME>.ts.net, https://longhorn.<TAILNET_NAME>.ts.net` |
| Allowed Web Origins | `https://argocd.<TAILNET_NAME>.ts.net, https://grafana.<TAILNET_NAME>.ts.net, https://longhorn.<TAILNET_NAME>.ts.net` |

> Replace `<TAILNET_NAME>` with your tailnet — see [Tailscale Setup](tailscale.md)

When adding new protected services, add their URLs here.

---

## 4. Create Action for Groups

Auth0 doesn't include roles in ID token by default. Create an Action to add them.

1. **Actions** → **Library** → **Build Custom**
2. Name: `Add Groups to Token`
3. Trigger: **Login / Post Login**
4. Code:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = '<AUTH0_GROUPS_CLAIM>';  // e.g., https://myapp
  if (event.authorization && event.authorization.roles) {
    api.idToken.setCustomClaim(`${namespace}/groups`, event.authorization.roles);
    api.accessToken.setCustomClaim(`${namespace}/groups`, event.authorization.roles);
  }
};
```

5. Click **Deploy**

> Save your namespace as `<AUTH0_GROUPS_CLAIM>` (e.g., `https://myapp`)

### Add Action to Login Flow

1. **Actions** → **Triggers** → **post-login**
2. Drag `Add Groups to Token` from right panel into the flow (between Start and Complete)
3. Click **Apply**

<details>
<summary><strong>Why namespaced claim?</strong></summary>

Auth0 requires namespace for custom claims. Without a namespace prefix (e.g., `https://myapp/groups`), the claim will be ignored.

In oauth2-proxy this is configured as:
```
oidc_groups_claim = "<AUTH0_GROUPS_CLAIM>/groups"
```

</details>

---

## 5. Create Roles (optional)

1. **User Management** → **Roles** → **Create Role**
2. Create roles:
   - `infra-admins` — full access to all services
   - `argocd-admins` — ArgoCD access
   - `monitoring-admins` — Grafana access
   - `longhorn-admins` — Longhorn access

### Assign Roles to Users

1. **User Management** → **Users** → Select user
2. **Roles** tab → **Assign Roles**
3. Select required roles

<details>
<summary><strong>How group-based access works</strong></summary>

1. User logs in via Auth0
2. Auth0 Action adds roles to `<namespace>/groups` claim
3. oauth2-proxy receives groups from token
4. NGINX passes `allowed_groups` to auth-url
5. oauth2-proxy checks intersection

Example ingress annotation:
```yaml
nginx.ingress.kubernetes.io/auth-url: "http://oauth2-proxy/oauth2/auth?allowed_groups=infra-admins,argocd-admins"
```

</details>

---

## Summary

**Placeholders for `values.yaml`:**
- `<AUTH0_DOMAIN>` — e.g., `myproject-dev.us.auth0.com`
- `<AUTH0_CLIENT_ID>` — from Application Settings
- `<AUTH0_GROUPS_CLAIM>` — namespace used in Action (e.g., `https://myapp`)

**Add to Doppler `shared`:**
- `AUTH0_CLIENT_SECRET` — from Application Settings

---

## Troubleshooting

<details>
<summary><strong>"Unable to verify OIDC token"</strong></summary>

- Check `auth0.domain` doesn't have `https://` prefix
- Check oauth2-proxy can reach Auth0

```bash
kubectl logs -n oauth2-proxy -l app.kubernetes.io/name=oauth2-proxy
```

</details>

<details>
<summary><strong>Groups empty in token</strong></summary>

1. Check Action is deployed
2. Check Action is in Login Flow
3. Check user has Roles assigned
4. Check `groupsClaim` in values.yaml matches Action namespace

```bash
# Check oauth2-proxy logs for groups
kubectl logs -n oauth2-proxy -l app.kubernetes.io/name=oauth2-proxy | grep groups
```

</details>

<details>
<summary><strong>403 after login</strong></summary>

- Groups don't match `allowed_groups` in ingress annotation
- Check user's roles in Auth0 Dashboard
- Check spelling (case-sensitive)

</details>

<details>
<summary><strong>Callback URL mismatch</strong></summary>

- URLs in Auth0 must exactly match ingress hosts
- Include protocol (`https://`) and path (`/oauth2/callback`)
- No trailing slash

</details>
