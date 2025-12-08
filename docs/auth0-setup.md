# Auth0 Setup

How to configure Auth0 for the example applications.

> **Official Docs**: [Auth0 Documentation](https://auth0.com/docs)

## Overview

| Application | Auth0 Type | Used By |
|-------------|------------|---------|
| SPA (React) | Application | `example-ui` |
| API (Spring Boot) | API | `example-api` |

## 1. Create Auth0 Account

1. Go to [Auth0 Signup](https://auth0.com/signup)
2. Create a tenant (e.g., `dev-abc123`)

## 2. Create API (for backend)

> **Docs**: [Auth0 API Authorization](https://auth0.com/docs/get-started/apis)

1. Go to [Auth0 Dashboard](https://manage.auth0.com/) → **Applications** → **APIs** → **Create API**
2. Set **Name** (e.g., `Example API`)
3. Set **Identifier** (e.g., `https://api.example.com`) — this becomes `AUTH0_AUDIENCE`
4. Click **Create**

**Copy to environment**:
- **Identifier** → `AUTH0_AUDIENCE`

## 3. Create SPA Application (for frontend)

> **Docs**: [Auth0 React Quickstart](https://auth0.com/docs/quickstart/spa/react/interactive)

1. Go to **Applications** → **Applications** → **Create Application**
2. Select **Single Page Web Applications**
3. Name it (e.g., `Example UI`)
4. Click **Create**

### Configure URLs

In **Application Settings**, configure allowed URLs:

| Setting | Development | Production |
|---------|-------------|------------|
| Allowed Callback URLs | `http://localhost:5173` | `https://app.example.com` |
| Allowed Logout URLs | `http://localhost:5173` | `https://app.example.com` |
| Allowed Web Origins | `http://localhost:5173` | `https://app.example.com` |

> **Tip**: Separate multiple URLs with commas

**Copy to environment**:
- **Domain** → `AUTH0_DOMAIN` (e.g., `dev-abc123.us.auth0.com`)
- **Client ID** → `AUTH0_CLIENT_ID`

## 4. Connect SPA to API

1. In your SPA application settings, scroll to **APIs**
2. Enable your API (e.g., `Example API`)

This allows the SPA to request tokens with your API's audience.

## Environment Variables Summary

### Frontend (`example-ui`)

```bash
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_CLIENT_ID=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
AUTH0_AUDIENCE=https://api.example.com
```

### Backend (`example-api`)

```bash
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_AUDIENCE=https://api.example.com
```

## Testing

1. Start the API: `./gradlew bootRun`
2. Start the UI: `npm run dev`
3. Click **Login** in the UI
4. After login, protected API endpoints should work
