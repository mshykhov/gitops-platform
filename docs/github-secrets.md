# GitHub Secrets Setup

How to configure secrets for CI/CD workflows.

## Required Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

## Setup Steps

### 1. Create Docker Hub Access Token

1. Go to [Docker Hub](https://hub.docker.com/) → **Account Settings** → **Security**
2. Click **New Access Token**
3. Name it (e.g., `github-actions`)
4. Select **Read & Write** permissions
5. Copy the token (shown only once)

> **Docs**: [Docker Hub Access Tokens](https://docs.docker.com/security/for-developers/access-tokens/)

### 2. Add Secrets to GitHub Repository

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret:

   | Name | Value |
   |------|-------|
   | `DOCKERHUB_USERNAME` | Your Docker Hub username |
   | `DOCKERHUB_TOKEN` | Access token from step 1 |

> **Docs**: [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Verify Setup

After pushing a tag, check **Actions** tab in GitHub to see workflow status.

```bash
git tag v0.1.0
git push origin v0.1.0
```
