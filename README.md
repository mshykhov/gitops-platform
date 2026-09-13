# GitOps Platform

A practical Kubernetes GitOps reference built around Argo CD. It is a starting
point for a small self-managed cluster, not a ready-to-run production
distribution. You must choose the components you need, provide your own
repository URL, images, credentials, DNS, and access policy before bootstrapping.

## What is here

The repository is intentionally a monorepo:

```
infrastructure/                 # Argo CD App-of-Apps and platform components
  bootstrap/root.yaml           # The one manifest applied by hand
  apps/                         # Child Applications and ApplicationSets
  charts/                       # Local Helm charts
  helm-values/                  # Values for upstream charts
  manifests/                    # Plain Kubernetes resources
deploy/                         # Service and database chart templates
apps/                           # Archived example applications, not deployed
docs/                           # Setup and operations notes
```

The root Application reads `infrastructure/apps`. The ApplicationSets then
discover service charts under `deploy/services` and database definitions under
`deploy/databases` in the same repository. Set both repository URL fields in
`infrastructure/apps/values.yaml` to your Git URL unless you deliberately split
the deploy content into a separate repository.

## Included platform components

The active manifests install Argo CD, External Secrets with Doppler,
CloudNativePG, Longhorn, Redis Operator, Reloader, Tailscale Operator,
Cloudflare Tunnel, External DNS, Traefik, Grafana Alloy,
VictoriaMetrics, VictoriaLogs, and Grafana. Authentik is opt-in because it
requires secrets and an external PostgreSQL cluster. Each component has an
operational cost, so remove Applications you do not intend to operate.

Image Updater and CNPG object-store backups are opt-in. They perform external
writes and require repository or S3 credentials before being enabled.

## Start here

1. Read [the architecture guide](docs/architecture.md) and decide which optional
   components you will keep.
2. Fork this repository or create your own private GitOps repository from it.
3. Edit `infrastructure/apps/values.yaml`: replace every placeholder and use
   your repository URL for both `spec.source.repoURL` and `deploy.repoURL`.
   Put the same URL and branch in `infrastructure/bootstrap/root.yaml`.
4. Prepare the external systems required by the components you kept. The
   [infrastructure guide](infrastructure/README.md) lists the order and checks.
5. Install Argo CD, register the repository credential, and apply:

   ```bash
   kubectl apply -f infrastructure/bootstrap/root.yaml
   ```

6. Watch the first reconciliation:

   ```bash
   kubectl get applications -n argocd -w
   ```

No image is supplied for a real service. Copy the templates under
`deploy/services/.example-service` and `deploy/databases/.example-service`, set
an image repository and tag that you build, then commit the configuration.

## Guides

- [Bootstrap and configuration](infrastructure/README.md)
- [Architecture and repository map](docs/architecture.md)
- [Deploy chart template](deploy/README.md)
- [Secrets reference](docs/reference/secrets.md)
- [Alerting operations](docs/operations/alerting.md)

The `apps/example-api` and `apps/example-ui` directories are retained as
readable examples. They are outside the GitOps discovery paths and are not
deployed by the platform.

## License

MIT
