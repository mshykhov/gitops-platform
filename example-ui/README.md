# Example UI

React SPA for testing backend APIs with Auth0 authentication.

## Tech Stack

- React 19, TypeScript, Vite 5
- Ant Design 5, Refine
- Auth0 (authentication)
- Docker (nginx-unprivileged)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `API_URL` | Backend API URL | Yes |
| `AUTH0_DOMAIN` | Auth0 tenant domain | Yes |
| `AUTH0_CLIENT_ID` | Auth0 SPA client ID | Yes |
| `AUTH0_AUDIENCE` | Auth0 API identifier | No |

### Example `.env.local`

```bash
API_URL=https://api.example.com
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_CLIENT_ID=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
AUTH0_AUDIENCE=https://api.example.com
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:5173 |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Docker

```bash
docker build -t example-ui .

docker run -p 8080:8080 \
  -e API_URL=https://api.example.com \
  -e AUTH0_DOMAIN=dev-abc123.us.auth0.com \
  -e AUTH0_CLIENT_ID=aBcDeFgHiJkLmNoPqRsTuVwXyZ123456 \
  example-ui
```

## Auth0 Setup

> **Docs**: [Auth0 React Quickstart](https://auth0.com/docs/quickstart/spa/react/interactive)

### 1. Create Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/) → Applications → Create Application
2. Select **Single Page Web Applications**
3. Name it (e.g., `Example UI`)

### 2. Configure URLs

In Application Settings, add your URLs:

| Setting | Development | Production |
|---------|-------------|------------|
| Allowed Callback URLs | `http://localhost:5173` | `https://app.example.com` |
| Allowed Logout URLs | `http://localhost:5173` | `https://app.example.com` |
| Allowed Web Origins | `http://localhost:5173` | `https://app.example.com` |

> **Tip**: Separate multiple URLs with commas

### 3. Copy Credentials

From Application Settings, copy:

- **Domain** → `AUTH0_DOMAIN` (e.g., `dev-abc123.us.auth0.com`)
- **Client ID** → `AUTH0_CLIENT_ID` (e.g., `aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`)

### 4. (Optional) Create API

If your backend requires authentication:

1. Go to Applications → APIs → Create API
2. Set **Identifier** (e.g., `https://api.example.com`)
3. Copy Identifier → `AUTH0_AUDIENCE`

> **Docs**: [Auth0 API Authorization](https://auth0.com/docs/get-started/apis)

## Configuration

| Environment | Config Source | Mechanism |
|-------------|---------------|-----------|
| Development | `.env.local` | Vite `loadEnv()` |
| Production | Env vars | `entrypoint.sh` → `config.js` |

## Project Structure

```
src/
├── components/    # UI components
├── config/        # App configuration
├── hooks/         # Custom React hooks
├── pages/         # Page components
├── styles/        # CSS styles
└── types/         # TypeScript types
```

## License

MIT
