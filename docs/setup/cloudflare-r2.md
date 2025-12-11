# Cloudflare R2 Setup

S3-compatible storage for PostgreSQL WAL backups (CloudNativePG).

> **Docs**: https://developers.cloudflare.com/r2/

## Prerequisites

- Cloudflare account ([Step 2.2](cloudflare.md))

---

## 1. Create Bucket

1. [R2 Dashboard](https://dash.cloudflare.com/?to=/:account/r2/new) → **Create bucket**
2. Name: `cnpg-backups`

---

## 2. Create API Token

1. [R2 API Tokens](https://dash.cloudflare.com/?to=/:account/r2/api-tokens) → **Create API token**
2. Configure:
   - **Token name**: `k8s-s3-api-token`
   - **Permissions**: Object Read & Write
   - **Specify bucket(s)**: `cnpg-backups`
3. Click **Create API Token**
4. Add to Doppler: `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY`
5. In R2 dashboard, find **Account ID** in the right sidebar → save as `<CF_ACCOUNT_ID>`

> R2 endpoint: `https://<CF_ACCOUNT_ID>.r2.cloudflarestorage.com`

---

## Summary

**Placeholders for `values.yaml`:**
- `<CF_ACCOUNT_ID>` — from R2 dashboard (right sidebar)

**Add to Doppler `shared`:**
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

---

## Pricing

| Resource | Free Tier | Paid |
|----------|-----------|------|
| Storage | 10 GB/month | $0.015/GB |
| Class A ops | 1M/month | $4.50/M |
| Class B ops | 10M/month | $0.36/M |
| Egress | Unlimited | $0 |
