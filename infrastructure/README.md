# Infrastructure bootstrap

This guide bootstraps the manifests in this repository. It assumes a single
GitOps monorepo: platform code under `infrastructure/` and service definitions
under `deploy/`. Do not apply it unchanged to a cluster. Review the components,
replace placeholders, and remove Applications for services you do not intend to
operate.

## Before you begin

You need a Kubernetes cluster, `kubectl`, Helm, a Git repository reachable by
Argo CD, and an SSH deploy key with read access to that repository. Longhorn
also needs an `open-iscsi` capable node. The helper script is optional and is
run from your clone:

```bash
sudo bash infrastructure/scripts/bootstrap.sh
```

Choose external integrations before configuring values:

| Component | Needed when you keep |
| --- | --- |
| Doppler | External Secrets and the credentials chart |
| Cloudflare | Tunnel, External DNS, or R2 backups |
| Tailscale | Tailscale Operator and private access |
| Authentik | Identity and ForwardAuth for protected ingresses |
| Docker Hub or another registry | Pulling private service images |
| Telegram | Argo CD notifications |

VictoriaMetrics, VictoriaLogs, and Grafana are enabled by the checked-in
Applications. Authentik starts disabled. Enabling it provisions a small
CloudNativePG cluster and expects credentials from External Secrets; creating
proxy providers and outposts remains an explicit operator step.

## 1. Configure the repository

Edit `infrastructure/apps/values.yaml` before installing the root Application.

- Replace every `<...>` value with a value for your cluster.
- Put the SSH URL of this repository in both `spec.source.repoURL` and
  `deploy.repoURL`. The supplied ApplicationSets scan `deploy/services` and
  `deploy/databases` in this monorepo.
- Keep `targetRevision: master` only if your branch is named `master`; otherwise
  change both values and `infrastructure/bootstrap/root.yaml` together.
- Set only service prefixes and environments that you intend to deploy.

`infrastructure/bootstrap/root.yaml` needs the same Git URL. It points to
`infrastructure/apps`; do not change that path unless you move the chart.

## 2. Prepare secrets and external accounts

The repository contains secret references, never secret values. Create the
required accounts and secret-store credentials before Argo CD reaches the
dependent Applications.

- [Doppler setup](../docs/setup/doppler.md)
- [Cloudflare and tunnel setup](../docs/setup/cloudflare.md)
- [Tailscale setup](../docs/setup/tailscale.md)
- [Telegram setup](../docs/setup/telegram.md)

To enable Authentik, set `global.components.authentik: true` and add the three
Authentik keys from the
[secrets reference](../docs/reference/secrets.md) to the shared Doppler config.
After the first sync, open the initial setup locally:

```bash
kubectl port-forward -n authentik service/authentik-server 9000:80
```

Visit `http://localhost:9000/if/flow/initial-setup/`. Before enabling
`forwardAuth`, route a browser-reachable hostname to Authentik, set that hostname
in `infrastructure/charts/protected-services/values.yaml`, and create only the
proxy providers and outposts needed by the ingresses you enable.

## 3. Install Argo CD and register this repository

Install Argo CD once with Helm. The root Application later manages the platform
configuration through GitOps.

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd -n argocd --create-namespace --wait
```

Create an SSH key for Argo CD and add its public half to your Git repository as
a read-only deploy key. Then register the private half in the cluster. Replace
the placeholder before running the command.

```bash
ssh-keygen -t ed25519 -C "argocd-gitops" -f ~/.ssh/argocd-gitops -N ""
kubectl create secret generic repo-gitops \
  --from-literal=type=git \
  --from-literal=url=<GITOPS_REPO_URL> \
  --from-file=sshPrivateKey=$HOME/.ssh/argocd-gitops \
  -n argocd
kubectl label secret repo-gitops argocd.argoproj.io/secret-type=repository -n argocd
```

## 4. Bootstrap and verify

Apply the root Application once:

```bash
kubectl apply -f infrastructure/bootstrap/root.yaml
kubectl get applications -n argocd -w
```

Investigate a failed child Application before changing its values. Start with
the Application status and its Events:

```bash
kubectl get application -n argocd
kubectl describe application <application-name> -n argocd
kubectl get clustersecretstores
```

After the initial sync, make configuration changes through Git and let Argo CD
reconcile them. The root Application and most children use automated prune and
self-heal, so ad-hoc cluster edits are temporary.

## Adding a service

Copy `deploy/services/.example-service` to `deploy/services/<service-name>` and
set an image repository and tag that you build. Copy only the database template
you need into `deploy/databases/<service-name>/`. The ApplicationSets create
one Application per configured environment.

See [the deploy guide](../deploy/README.md) for the chart contract and
[the architecture guide](../docs/architecture.md) for the source paths.
