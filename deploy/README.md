# Deploy

Kubernetes deployment configurations using Helm charts with ArgoCD GitOps.

## Structure

```
deploy/
├── _library/              # Reusable Helm library chart
│   └── templates/
│       ├── _deployment.tpl
│       ├── _service.tpl
│       ├── _pdb.tpl
│       ├── _servicemonitor.tpl
│       └── ...
├── services/              # Application Helm charts
│   └── my-service/
│       ├── Chart.yaml
│       ├── values.yaml        # Base config
│       ├── values-dev.yaml    # Dev overrides
│       ├── values-prd.yaml    # Prd overrides
│       └── templates/         # Uses library includes
└── databases/             # Database configurations
    └── my-service/
        ├── postgres/
        │   ├── main.yaml
        │   ├── main-dev.yaml
        │   └── main-prd.yaml
        └── redis/
            └── cache.yaml
```

## Quick Start

### 1. Create a new service

```bash
# Run from the repository root.
cp -r deploy/services/.example-service deploy/services/my-service

# Update the chart and named template identifiers (portable on macOS and Linux)
perl -pi -e 's/example-service/my-service/g' \
  deploy/services/my-service/Chart.yaml \
  deploy/services/my-service/templates/*.yaml

# Edit values.yaml with your config
```

### 2. Configure values

**values.yaml** - Base configuration (all environments):
```yaml
image:
  repository: your-registry/my-service
  tag: "1.0.0"

containerPort: 8080

resources:
  requests:
    cpu: 100m
    memory: 128Mi
```

**values-prd.yaml** - Production overrides:
```yaml
replicaCount: 2

resources:
  limits:
    memory: 512Mi
```

### 3. Update Helm dependencies

```bash
cd deploy/services/my-service
helm dependency update
```

## Library Chart Features

The `_library` chart provides reusable templates with best practices:

| Template | Description | Auto-enabled |
|----------|-------------|:------------:|
| `_deployment.tpl` | Deployment with probes, security context | Always |
| `_service.tpl` | ClusterIP Service | Always |
| `_serviceaccount.tpl` | ServiceAccount | When `serviceAccount.create: true` |
| `_hpa.tpl` | HorizontalPodAutoscaler | When `autoscaling.enabled: true` |
| `_pdb.tpl` | PodDisruptionBudget | When `replicaCount > 1` |
| `_servicemonitor.tpl` | Prometheus ServiceMonitor | When `serviceMonitor.enabled: true` |
| `_externalsecret.tpl` | ExternalSecret and Deployment `envFrom` | When `secrets.enabled: true` |

Each service template passes an empty named override to the library. Add only
service-specific fields to that named template; shared Kubernetes structure
stays in `_library`.

## Values Reference

### Image

```yaml
image:
  repository: your-registry/your-image
  tag: "1.0.0"
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: registry-credentials
```

### Probes

```yaml
# Health checks
livenessProbe:
  enabled: true
  path: /health
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  enabled: true
  path: /health
  initialDelaySeconds: 5
  periodSeconds: 5

# For slow-starting apps (Java/Spring Boot)
startupProbe:
  enabled: true
  path: /health
  failureThreshold: 30
  periodSeconds: 10
```

### Resources

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

### High Availability

```yaml
# Replicas
replicaCount: 2

# PodDisruptionBudget (auto-enabled when replicaCount > 1)
pdb:
  enabled: true       # Optional, auto-enabled
  minAvailable: 1     # Or use maxUnavailable
```

### Monitoring

```yaml
serviceMonitor:
  enabled: true
  path: /metrics          # Or /actuator/prometheus for Spring Boot
  interval: 30s
  scrapeTimeout: 10s
```

### Environment Variables

```yaml
# Base env vars (in values.yaml) - shared across all environments
env:
  - name: APP_NAME
    value: "my-service"

# Environment-specific additions (in values-dev.yaml or values-prd.yaml)
# IMPORTANT: Use extraEnv to ADD variables, not override env[]
# extraEnv is merged with env[], so base vars are preserved
extraEnv:
  - name: DATABASE_URL
    value: "postgres://..."
  - name: LOG_LEVEL
    value: "debug"
```

External Secrets can populate the Deployment without duplicating a Secret
manifest:

```yaml
secrets:
  enabled: true
  secretStore: doppler-prd
  data:
    - secretKey: API_TOKEN
      remoteKey: MY_SERVICE_API_TOKEN
```

> **Note**: Always use `extraEnv` in environment files (values-dev.yaml, values-prd.yaml) to add variables. If you override `env`, you'll lose base variables defined in values.yaml.

## Database Configurations

### PostgreSQL (CloudNativePG)

```yaml
# deploy/databases/my-service/postgres/main.yaml
cluster:
  name: my-service-db
  instances: 1
  storage:
    size: 5Gi

# deploy/databases/my-service/postgres/main-prd.yaml
cluster:
  instances: 2
  storage:
    size: 20Gi
backups:
  # Also requires global.components.cnpgBackups and S3 configuration.
  enabled: true
```

### Redis (OT Operator)

```yaml
# databases/my-service/redis/cache.yaml
name: my-service-cache
mode: standalone
resources:
  limits:
    memory: 128Mi
storage:
  enabled: false  # In-memory for cache
```

## ArgoCD Integration

Services are deployed via ArgoCD ApplicationSet. Each service needs:

1. **Helm chart** in `deploy/services/<name>/`
2. **Environment files** named `values-<env>.yaml`; each file creates one Application
3. **Database configs** in `deploy/databases/<name>/` (optional)

ArgoCD will:
- Auto-sync on git push
- Use `values.yaml` + `values-<env>.yaml`
- Inject secrets via External Secrets
- Create ImageUpdater resources from `values.yaml` when Image Updater is enabled

## Best Practices

1. **DRY**: Use library chart, avoid duplicating templates
2. **Environment separation**: Base values + env overrides
3. **Security**: Non-root user, drop capabilities, read-only root
4. **Probes**: Always configure health checks
5. **Resources**: Always set requests and limits
6. **HA**: Use replicaCount > 1 in production (auto-enables PDB)
7. **Monitoring**: Enable ServiceMonitor for Prometheus

## Spring Boot Example

```yaml
# values.yaml
containerPort: 8080

livenessProbe:
  path: /actuator/health/liveness

readinessProbe:
  path: /actuator/health/readiness

startupProbe:
  enabled: true
  path: /actuator/health/liveness
  failureThreshold: 30
  periodSeconds: 10

terminationGracePeriodSeconds: 60

serviceMonitor:
  enabled: true
  path: /actuator/prometheus
```

## License

MIT
