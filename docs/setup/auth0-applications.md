# Auth0 Setup for Applications

Auth0 configuration for user-facing applications (SPA frontend + API backend).

> **Docs**: https://auth0.com/docs/quickstart/spa/react

## Prerequisites

- Auth0 account with tenant ([Step 2.4](auth0-oauth2-proxy.md#1-create-auth0-account))

---

## 1. Create API (Resource Server)

1. [APIs](https://manage.auth0.com/dashboard) → **Applications** → **APIs** → **Create API**
2. Name: `Example API`
3. Identifier: `https://api.example.com`
4. Signing Algorithm: **RS256**
5. Click **Create**
6. Save Identifier as `<AUTH0_AUDIENCE>`

---

## 2. Create SPA Application

1. **Applications** → **Applications** → **Create Application**
2. Name: `example-ui-dev` (or `example-ui-prd`)
3. Type: **Single Page Application**
4. Click **Create**

### Configure URLs

In **Settings** → **Application URIs**:

**Development:**

| Setting | Value |
|---------|-------|
| Allowed Callback URLs | `http://localhost:5173, https://<APP>-dev.<TAILNET_NAME>.ts.net` |
| Allowed Logout URLs | `http://localhost:5173, https://<APP>-dev.<TAILNET_NAME>.ts.net` |
| Allowed Web Origins | `http://localhost:5173, https://<APP>-dev.<TAILNET_NAME>.ts.net` |

**Production:**

| Setting | Value |
|---------|-------|
| Allowed Callback URLs | `https://app.<DOMAIN>` |
| Allowed Logout URLs | `https://app.<DOMAIN>` |
| Allowed Web Origins | `https://app.<DOMAIN>` |

> **Note**: SPA doesn't use Client Secret (public client).

### Connect SPA to API

1. In SPA application settings, scroll to **APIs**
2. Enable your API (e.g., `Example API`)

---

## 3. Groups in Token

The Action created in [oauth2-proxy setup](auth0-oauth2-proxy.md#4-create-action-for-groups) works for SPA too.

Roles assigned to users will appear in `<AUTH0_GROUPS_CLAIM>/groups` claim in both ID and Access tokens.

---

## Summary

**Placeholders for `values.yaml`:**
- `<AUTH0_AUDIENCE>` — API identifier (e.g., `https://api.example.com`)

**Doppler `shared`:**
- `AUTH0_CLIENT_SECRET` — same secret used by oauth2-proxy

> **Note**: `AUTH0_DOMAIN` and `AUTH0_CLIENT_ID` are already configured in oauth2-proxy setup.

---

## Troubleshooting

<details>
<summary><strong>"Unable to verify token" in API</strong></summary>

- Check `AUTH0_DOMAIN` doesn't have `https://` prefix
- Check `AUTH0_AUDIENCE` matches in both UI and API

</details>

<details>
<summary><strong>CORS errors</strong></summary>

- Check Allowed Web Origins in Auth0 includes UI origin
- Check CORS configured in backend API

</details>

<details>
<summary><strong>Callback URL mismatch</strong></summary>

- URL must exactly match (including trailing slash)
- Check protocol (http vs https)

</details>

<details>
<summary><strong>Dev Keys warning</strong></summary>

If not using Social Connections (Google, Facebook login):

1. **Authentication** → **Social**
2. Disable all providers with "Dev Keys" label

</details>
