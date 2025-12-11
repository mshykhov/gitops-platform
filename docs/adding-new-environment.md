# Adding a New Environment

This guide explains how to add a new environment (e.g., `stg`) to the platform.

## Prerequisites

- Access to infrastructure and deploy repositories
- Doppler project access
- Auth0 tenant access (if environment needs authentication)

## Steps

### 1. Infrastructure Repository

Update the environment list in **3 ApplicationSet files**:

| File | Path |
|------|------|
| Services | `apps/templates/services/services-appset.yaml` |
| PostgreSQL | `apps/templates/data/postgres-clusters.yaml` |
| Redis | `apps/templates/data/redis-clusters.yaml` |

Add your environment to the `list.elements`:

```yaml
- list:
    elements:
      - env: dev
        imageConstraint: "~0-0"
      - env: stg                  # <- add this
        imageConstraint: "~0"
      - env: prd
        imageConstraint: "~0"
```

> **Note:** For postgres and redis files, only `env` field is needed (no `imageConstraint`).

### 2. PostgreSQL Defaults

Create `helm-values/data/postgres-stg-defaults.yaml`.

> **Reference:** [CloudNativePG Resource Management](https://cloudnative-pg.io/documentation/current/resource_management/) — memory should be ≥4x `shared_buffers`

```yaml
type: postgresql

version:
  postgresql: "17"

cluster:
  instances: 2
  storage:
    storageClass: longhorn
  resources:
    requests:
      cpu: 200m
      memory: 384Mi
    limits:
      cpu: 750m
      memory: 896Mi
  monitoring:
    enabled: true
    podMonitor:
      enabled: true

# Backups - https://cloudnative-pg.io/documentation/current/backup/
backups:
  enabled: true
  provider: s3
  retentionPolicy: "14d"
  endpointURL: <S3_ENDPOINT>
  destinationPath: s3://<S3_BUCKET_CNPG>/
  s3:
    region: auto
    bucket: <S3_BUCKET_CNPG>
  secret:
    create: false
    name: cnpg-backup-s3
  scheduledBackups:
    - name: daily
      schedule: "0 0 2 * * *"
      backupOwnerReference: cluster
      method: barmanObjectStore
  data:
    compression: gzip
    jobs: 1
  wal:
    compression: gzip
    maxParallel: 1

recovery:
  method: object_store
  provider: s3
  endpointURL: <S3_ENDPOINT>
  destinationPath: s3://<S3_BUCKET_CNPG>/
  s3:
    region: auto
    bucket: <S3_BUCKET_CNPG>
  secret:
    create: false
    name: cnpg-backup-s3
```

### 3. Deploy Repository

For each service, create `services/<service>/values-stg.yaml`:

```yaml
replicaCount: 2

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

env:
  ENVIRONMENT: "staging"
```

### 4. Doppler

1. Open [Doppler Dashboard](https://dashboard.doppler.com)
2. Navigate to your project
3. Click **Add Environment** → name it `stg`
4. Copy secrets from `dev` or `prd`
5. Update environment-specific values

### 5. Auth0 (if needed)

If the new environment requires authentication:

1. Open [Auth0 Dashboard](https://manage.auth0.com)
2. Go to **Applications** → **Create Application**
3. Configure callback URLs for the new environment
4. Add the new URLs to `whitelist_domains` in OAuth2 Proxy config

## Optional

### Ingress Access

To expose services in the new environment, edit `charts/protected-services/values.yaml`:

```yaml
services:
  myservice-stg:
    enabled: true
    oauth2: false
    namespace: myservice-stg
    backend:
      name: myservice-stg
      port: 8080
```

### Image Auto-Deploy

To enable automatic deployments, create `manifests/apps/image-updater/<service>.yaml` with a `stg` application reference.

## Checklist

- [ ] Updated 3 ApplicationSet files
- [ ] Created postgres defaults file
- [ ] Created service values in deploy repo
- [ ] Created Doppler environment
- [ ] Configured Auth0 (if needed)
- [ ] Synced ArgoCD
