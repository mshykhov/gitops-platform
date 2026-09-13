#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
render_dir="$(mktemp -d)"
trap 'rm -rf "$render_dir"' EXIT

cd "$repo_root"

helm dependency build infrastructure/charts/victoria-metrics-k8s-stack

helm lint infrastructure/apps
helm lint infrastructure/charts/authentik-platform
helm lint infrastructure/charts/victoria-metrics-k8s-stack

helm template infrastructure infrastructure/apps > "$render_dir/apps.yaml"
helm template infrastructure infrastructure/apps \
  --set global.components.authentik=true > "$render_dir/apps-authentik.yaml"
helm template authentik-platform infrastructure/charts/authentik-platform \
  > "$render_dir/authentik-platform.yaml"
helm template credentials infrastructure/charts/credentials \
  --set global.authentik.enabled=true \
  --set global.tailscale.clientId=example \
  --set global.dockerhub.username=example \
  > "$render_dir/credentials-authentik.yaml"
helm template protected-services infrastructure/charts/protected-services \
  --set authentik.host=sso.example.com \
  --set services.argocd.enabled=true \
  --set global.tailnet=example \
  --set global.domain=example.com \
  --set global.cloudflare.tunnelId=example \
  > "$render_dir/protected-services.yaml"
helm template victoria-metrics infrastructure/charts/victoria-metrics-k8s-stack \
  > "$render_dir/victoria-metrics.yaml"
helm template authentik authentik \
  --repo https://charts.goauthentik.io \
  --version 2026.5.6 \
  --values infrastructure/helm-values/core/authentik.yaml \
  > "$render_dir/authentik.yaml"
helm template victoria-logs victoria-logs-single \
  --repo https://victoriametrics.github.io/helm-charts \
  --version 0.13.9 \
  --values infrastructure/helm-values/monitoring/victoria-logs.yaml \
  > "$render_dir/victoria-logs.yaml"

if grep -q '^  name: authentik$' "$render_dir/apps.yaml"; then
  echo "Authentik must stay disabled in the default render" >&2
  exit 1
fi
grep -q '^  name: authentik$' "$render_dir/apps-authentik.yaml"
awk 'BEGIN { RS="---" } /name: credentials/ && /authentik:[[:space:]]+enabled: true/ { found=1 } END { exit !found }' \
  "$render_dir/apps-authentik.yaml"
grep -q 'name: authentik-db' "$render_dir/authentik-platform.yaml"
awk 'BEGIN { RS="---" } /kind: Namespace/ && /name: authentik/ { found=1 } END { exit !found }' \
  "$render_dir/credentials-authentik.yaml"
awk 'BEGIN { RS="---" } /kind: ExternalSecret/ && /name: authentik/ { found=1 } END { exit !found }' \
  "$render_dir/credentials-authentik.yaml"
grep -Fq 'https://sso.example.com/outpost.goauthentik.io/start' \
  "$render_dir/protected-services.yaml"
grep -q 'name: authentik-db-app' "$render_dir/authentik.yaml"
grep -q '^kind: VMSingle$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: VMAgent$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: VMAlert$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: VMAlertmanager$' "$render_dir/victoria-metrics.yaml"
grep -q '^kind: StatefulSet$' "$render_dir/victoria-logs.yaml"
grep -q -- '--retentionPeriod=7d' "$render_dir/victoria-logs.yaml"

for database in postgres redis; do
  appset="infrastructure/apps/templates/data/${database}-clusters.yaml"
  grep -Fq -- "- path: deploy/databases/*/${database}/*.yaml" "$appset"
  if ! grep -F -A1 -- '- path: deploy/databases/.*/*/*.yaml' "$appset" \
    | grep -Fq 'exclude: true'; then
    echo "Missing hidden fixture exclusion for ${database}" >&2
    exit 1
  fi
  if ! grep -F -A1 -- "- path: deploy/databases/*/${database}/*-dev.yaml" "$appset" \
    | grep -Fq 'exclude: true'; then
    echo "Missing dev override exclusion for ${database}" >&2
    exit 1
  fi
  if ! grep -F -A1 -- "- path: deploy/databases/*/${database}/*-prd.yaml" "$appset" \
    | grep -Fq 'exclude: true'; then
    echo "Missing prd override exclusion for ${database}" >&2
    exit 1
  fi
done

if ! grep -F -A1 -- '- path: deploy/services/.*' \
  infrastructure/apps/templates/services/services-appset.yaml \
  | grep -Fq 'exclude: true'; then
  echo "Missing hidden service fixture exclusion" >&2
  exit 1
fi

postgres_roots="$(find deploy/databases/.example-service/postgres -type f -name '*.yaml' \
  ! -name '*-dev.yaml' ! -name '*-prd.yaml' | wc -l | tr -d ' ')"
if [[ "$postgres_roots" != "1" ]]; then
  echo "The database fixture must expose exactly one root PostgreSQL definition" >&2
  exit 1
fi

echo "GitOps validation passed"
