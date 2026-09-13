# Architecture

This repository uses Argo CD's App-of-Apps pattern. One root Application points
at the Helm chart in `infrastructure/apps`. That chart renders child
Applications for platform components and ApplicationSets for services and
databases.

```
bootstrap/root.yaml
        |
        v
infrastructure/apps
  ├── platform Applications -> infrastructure/charts, helm-values, manifests
  └── ApplicationSets
        ├── services -> deploy/services/*/values-*.yaml
        ├── image updates -> deploy/services/*/values.yaml
        ├── PostgreSQL -> deploy/databases/*/postgres/*.yaml
        └── Redis -> deploy/databases/*/redis/*.yaml
```

All internal paths are rooted in this monorepo. Both source URLs in
`infrastructure/apps/values.yaml` therefore use the same Git URL by default.
You may split `deploy/` into another repository later, but then update the
ApplicationSet repository URL and remove the `deploy/` prefix from its glob
paths as one coherent change.

## Reconciliation order

The rendered Applications use sync waves:

| Wave | Purpose |
| --- | --- |
| 0 | Argo CD configuration |
| 1-9 | Core operators and secret stores |
| 10-19 | Data services and network prerequisites |
| 20-29 | Public and private networking |
| 30-39 | Monitoring and alert rules |
| 100 | User services |

The data and service ApplicationSets only discover directories that match their
configured globs. Directories beginning with `_` and the dot-prefixed example
templates are excluded from service discovery. A service becomes deployable
only after you copy a template to a non-hidden directory and set a real image
repository and tag.

## Component status

| Area | Implemented manifests | Notes |
| --- | --- | --- |
| Delivery | Argo CD, Image Updater CRs | File-driven service discovery; write-back is opt-in. |
| Secrets | External Secrets and Doppler stores | Supply your own Doppler tokens and secret names. |
| Data | CloudNativePG, Redis Operator, Longhorn | Retain only what your workload and storage can support. |
| Network | Tailscale, Cloudflare Tunnel, External DNS, Traefik | Traefik receives both edge paths through a ClusterIP service. |
| Access | Authentik embedded outpost | Opt-in deployment. Traefik exposes the callback path on every protected host. |
| Observability | Grafana Alloy, VictoriaMetrics, VictoriaLogs, Grafana | Metrics and logs use separate single-node stores sized for a small cluster. |

Grafana Alloy sends Kubernetes logs to VictoriaLogs through its Loki-compatible
write endpoint. The VictoriaMetrics operator converts the checked-in
PrometheusRule and ServiceMonitor resources. The setup intentionally omits
provider automation, custom dashboards, and distributed storage. CNPG-I backups
are included as an opt-in contract using cert-manager and plugin-barman-cloud.

Service Applications are generated from environment files, so deleting
`values-dev.yaml` removes only the dev Application. ImageUpdater resources are
generated separately from each service's base `values.yaml`; their semver
write-back targets `image.repository` and `image.tag` in the same monorepo.

## Operational rule

After bootstrap, Git is the desired state. Commit configuration changes and let
Argo CD reconcile them. Use `kubectl` to inspect status and troubleshoot, not
as a second configuration channel.
