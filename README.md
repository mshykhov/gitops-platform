# GitOps Platform

Example GitOps platform for Kubernetes — a reference implementation for learning and building your own infrastructure.

## Features

### GitOps & CI/CD
- **ArgoCD** — Declarative continuous deployment with App-of-Apps pattern
- **ArgoCD Image Updater** — Automatic image updates from container registries

### Core Infrastructure
- **External Secrets** — Secure secrets management with Doppler integration
- **CloudNative-PG** — Production PostgreSQL clusters with automated failover
- **Longhorn** — Distributed block storage for persistent volumes
- **Redis Operator** — Managed Redis clusters
- **Reloader** — Automatic pod restarts on ConfigMap/Secret changes

### Networking & Security
- **Cloudflare Tunnel** — Zero-trust access without exposing ports
- **Tailscale Operator** — Secure mesh networking and kubectl access
- **NGINX Ingress** — Traffic routing and load balancing
- **OAuth2 Proxy** — Authentication for internal services via Auth0
- **External DNS** — Automatic DNS record management

### Observability
- **Prometheus Stack** — Metrics, alerting, and Grafana dashboards
- **Loki** — Log aggregation and querying
- **Grafana Alloy** — Unified telemetry collection
- **Telegram Alerts** — Real-time notifications for critical events

### Example Applications
- **Kotlin API** — Spring Boot backend with Auth0 JWT authentication
- **React UI** — Vite-based frontend with Auth0 integration

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitOps Platform                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   ArgoCD    │  │   Doppler   │  │      Cloudflare         │  │
│  │  (GitOps)   │  │  (Secrets)  │  │  (Tunnel + DNS + R2)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ PostgreSQL  │  │    Redis    │  │       Longhorn          │  │
│  │  (CNPG)     │  │  (Cluster)  │  │       (Storage)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Prometheus  │  │    Loki     │  │        Grafana          │  │
│  │  (Metrics)  │  │   (Logs)    │  │      (Dashboards)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Tailscale  │  │ OAuth2-Proxy│  │    NGINX Ingress        │  │
│  │  (VPN/SSH)  │  │   (Auth0)   │  │      (Routing)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         k3s Cluster                             │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │   example-api    │◄──────►│   example-ui     │               │
│  │  (Kotlin/Spring) │        │  (React/Vite)    │               │
│  └──────────────────┘        └──────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

1. **Server Setup** — Install k3s on your server
2. **External Services** — Configure Doppler, Cloudflare, Tailscale, Auth0
3. **Bootstrap ArgoCD** — Install ArgoCD and configure SSH keys
4. **Deploy** — Apply `bootstrap/root.yaml` and watch everything sync

See [infrastructure/README.md](infrastructure/README.md) for detailed setup guide.

## Repository Structure

```
├── apps/                    # Example applications
│   ├── example-api/         # Kotlin Spring Boot API
│   └── example-ui/          # React Vite frontend
├── deploy/                  # Application deployment configs
│   ├── _library/            # Shared Helm templates
│   ├── databases/           # Database configurations
│   └── services/            # Service configurations
├── infrastructure/          # GitOps infrastructure
│   ├── apps/                # ArgoCD App-of-Apps
│   ├── bootstrap/           # Entry point (root.yaml)
│   ├── charts/              # Custom Helm charts
│   ├── helm-values/         # Values for upstream charts
│   └── manifests/           # Raw Kubernetes manifests
├── docs/                    # Documentation
└── scripts/                 # Utility scripts
```

## Documentation

- [Infrastructure Setup](infrastructure/README.md) — Complete setup guide
- [Adding New Environment](docs/operations/adding-new-environment.md) — Add dev/stg/prd environments
- [Secrets Reference](docs/reference/secrets.md) — All secrets and configuration
- [Alerting Operations](docs/operations/alerting.md) — Managing alerts

## License

MIT
