#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
render_dir="$(mktemp -d)"
trap 'rm -rf "$render_dir"' EXIT
cd "$repo_root"

export HELM_REPOSITORY_CONFIG="$render_dir/repositories.yaml"
export HELM_REPOSITORY_CACHE="$render_dir/repository"
mkdir -p "$HELM_REPOSITORY_CACHE"

helm repo add victoria-metrics https://victoriametrics.github.io/helm-charts --force-update
helm dependency build infrastructure/charts/victoria-metrics-k8s-stack
helm dependency build deploy/services/.example-service

for chart in \
  infrastructure/apps \
  infrastructure/charts/authentik-platform \
  infrastructure/charts/credentials \
  infrastructure/charts/protected-services \
  infrastructure/charts/victoria-metrics-k8s-stack \
  deploy/services/.example-service; do
  helm lint "$chart"
done
helm lint infrastructure/charts/image-updater-cr \
  --set serviceName=example-service \
  --set imageName=example/example-service

helm template infrastructure infrastructure/apps > "$render_dir/apps.yaml"
helm template infrastructure infrastructure/apps \
  --set global.components.authentik=true \
  --set global.components.imageUpdater=true \
  --set global.components.cnpgBackups=true \
  > "$render_dir/apps-all.yaml"
helm template authentik-platform infrastructure/charts/authentik-platform \
  > "$render_dir/authentik-platform.yaml"
helm template credentials infrastructure/charts/credentials \
  --set global.authentik.enabled=true \
  --set global.cnpgBackups.enabled=true \
  --set global.tailscale.clientId=example \
  --set global.dockerhub.username=example \
  > "$render_dir/credentials.yaml"
helm template protected-services infrastructure/charts/protected-services \
  --set services.argocd.enabled=true \
  --set global.tailnet=example \
  --set global.domain=example.com \
  --set global.cloudflare.tunnelId=example \
  > "$render_dir/protected-services.yaml"
helm template cloudflare-tunnel infrastructure/charts/cloudflare-tunnel \
  --set tunnel.uuid=example > "$render_dir/cloudflare-tunnel.yaml"
helm template image-updater infrastructure/charts/image-updater-cr \
  --set serviceName=example-service \
  --set imageName=example/example-service > "$render_dir/image-updater.yaml"
helm template example-service deploy/services/.example-service \
  --set secrets.enabled=true \
  --set secrets.secretStore=doppler-prd \
  --set 'secrets.data[0].secretKey=API_TOKEN' \
  --set 'secrets.data[0].remoteKey=EXAMPLE_API_TOKEN' \
  --set strategy.type=Recreate \
  --set priorityClassName=application > "$render_dir/example-service.yaml"
helm template victoria-metrics infrastructure/charts/victoria-metrics-k8s-stack \
  > "$render_dir/victoria-metrics.yaml"

helm template authentik authentik --repo https://charts.goauthentik.io \
  --version 2026.5.6 --values infrastructure/helm-values/core/authentik.yaml \
  > "$render_dir/authentik.yaml"
helm template victoria-logs victoria-logs-single \
  --repo https://victoriametrics.github.io/helm-charts --version 0.13.9 \
  --values infrastructure/helm-values/monitoring/victoria-logs.yaml \
  > "$render_dir/victoria-logs.yaml"
helm template traefik traefik --repo https://traefik.github.io/charts \
  --version 41.1.0 --values infrastructure/helm-values/network/traefik.yaml \
  --api-versions monitoring.coreos.com/v1 \
  > "$render_dir/traefik.yaml"
helm template cert-manager cert-manager --repo https://charts.jetstack.io \
  --version v1.21.1 --values infrastructure/helm-values/core/cert-manager.yaml \
  > "$render_dir/cert-manager.yaml"
helm template plugin-barman-cloud plugin-barman-cloud \
  --repo https://cloudnative-pg.github.io/charts --version 0.7.0 \
  --values infrastructure/helm-values/core/plugin-barman-cloud.yaml \
  > "$render_dir/plugin-barman-cloud.yaml"
helm template postgres cluster --repo https://cloudnative-pg.github.io/charts \
  --version 0.8.1 \
  --values infrastructure/helm-values/data/postgres-prd-defaults.yaml \
  --values deploy/databases/.example-service/postgres/main.yaml \
  --set backups.enabled=true \
  --set backups.endpointURL=https://s3.example.com \
  --set backups.destinationPath=s3://example/ \
  --set backups.s3.region=us-east-1 \
  --set backups.s3.bucket=example > "$render_dir/postgres-backup.yaml"

for name in authentik argocd-image-updater cert-manager plugin-barman-cloud image-updater-crs; do
  if grep -q "name: $name" "$render_dir/apps.yaml"; then
    echo "$name must stay disabled in the default render" >&2
    exit 1
  fi
  grep -q "name: $name" "$render_dir/apps-all.yaml"
done

grep -q 'name: authentik-db' "$render_dir/authentik-platform.yaml"
grep -q 'name: authentik-db-app' "$render_dir/authentik.yaml"
awk 'BEGIN { RS="---" } /kind: Namespace/ && /name: authentik/ { found=1 } END { exit !found }' \
  "$render_dir/credentials.yaml"
awk 'BEGIN { RS="---" } /kind: ExternalSecret/ && /name: authentik/ { found=1 } END { exit !found }' \
  "$render_dir/credentials.yaml"
grep -q 'name: cnpg-backup-credentials' "$render_dir/credentials.yaml"

grep -q '^kind: Middleware$' "$render_dir/protected-services.yaml"
grep -q 'name: argocd-outpost' "$render_dir/protected-services.yaml"
same_origin_hosts="$(grep -c 'host: argocd.example.ts.net' "$render_dir/protected-services.yaml" || true)"
if [ "$same_origin_hosts" -ne 3 ]; then
  echo "Protected route, logout, and Authentik callback must use the same host" >&2
  exit 1
fi
grep -Fq 'authentik-server.authentik.svc.cluster.local:80/outpost.goauthentik.io/auth/traefik' \
  "$render_dir/protected-services.yaml"
grep -Fq 'http://traefik.traefik.svc.cluster.local:80' "$render_dir/cloudflare-tunnel.yaml"
grep -q '^kind: Deployment$' "$render_dir/traefik.yaml"

grep -q '^kind: ImageUpdater$' "$render_dir/image-updater.yaml"
grep -q 'namePattern: "example-service-dev"' "$render_dir/image-updater.yaml"
grep -q 'namePattern: "example-service-prd"' "$render_dir/image-updater.yaml"
grep -q 'git:secret:argocd/repo-gitops' "$render_dir/image-updater.yaml"

grep -q '^kind: ExternalSecret$' "$render_dir/example-service.yaml"
grep -q 'envFrom:$' "$render_dir/example-service.yaml"
grep -q '^  strategy:$' "$render_dir/example-service.yaml"
grep -q '^      priorityClassName: application$' "$render_dir/example-service.yaml"

grep -q '^kind: ObjectStore$' "$render_dir/postgres-backup.yaml"
grep -q '^kind: ScheduledBackup$' "$render_dir/postgres-backup.yaml"
grep -q 'name: barman-cloud.cloudnative-pg.io' "$render_dir/postgres-backup.yaml"
grep -q '^kind: Deployment$' "$render_dir/plugin-barman-cloud.yaml"
grep -q '^kind: Deployment$' "$render_dir/cert-manager.yaml"

grep -q '^kind: VMSingle$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: VMAgent$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: VMAlert$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: VMAlertmanager$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: StatefulSet$' "$render_dir/victoria-logs.yaml"
grep -q -- '--retentionPeriod=7d' "$render_dir/victoria-logs.yaml"

for database in postgres redis; do
  appset="infrastructure/apps/templates/data/$database-clusters.yaml"
  grep -Fq -- "- path: deploy/databases/*/$database/*.yaml" "$appset"
  for pattern in \
    '- path: deploy/databases/.*/*/*.yaml' \
    "- path: deploy/databases/*/$database/*-dev.yaml" \
    "- path: deploy/databases/*/$database/*-prd.yaml"; do
    if ! grep -F -A1 -- "$pattern" "$appset" | grep -Fq 'exclude: true'; then
      echo "Missing database discovery exclusion: $pattern" >&2
      exit 1
    fi
  done
done

for appset in \
  infrastructure/apps/templates/services/services-appset.yaml \
  infrastructure/apps/templates/cicd/image-updater-crs.yaml; do
  if ! grep -F -A1 -- 'deploy/services/.*' "$appset" | grep -Fq 'exclude: true'; then
    echo "Missing hidden service fixture exclusion in $appset" >&2
    exit 1
  fi
done

postgres_roots="$(find deploy/databases/.example-service/postgres -type f -name '*.yaml' \
  ! -name '*-dev.yaml' ! -name '*-prd.yaml' | wc -l | tr -d ' ')"
if [[ "$postgres_roots" != "1" ]]; then
  echo "The database fixture must expose exactly one root PostgreSQL definition" >&2
  exit 1
fi

echo "GitOps validation passed"
