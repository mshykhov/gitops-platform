#!/bin/bash
# =============================================================================
# K3s + Tools Bootstrap Script
# =============================================================================
# Installs: k3s (without traefik/servicelb), kubectl, helm, k9s
# Target: Ubuntu 22.04+ / Debian-based systems
# Usage: sudo ./bootstrap.sh
#
# Docs:
#   - k3s: https://docs.k3s.io/installation
#   - Helm: https://helm.sh/docs/intro/install/
#   - k9s: https://k9scli.io/topics/install/
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"; }

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Run as root: sudo ./bootstrap.sh"
        exit 1
    fi
}

check_system() {
    log_step "Checking system"

    if ! command -v apt-get &> /dev/null; then
        log_error "Requires apt-get (Debian/Ubuntu)"
        exit 1
    fi

    local mem_gb=$(awk '/MemTotal/ {print int($2/1024/1024)}' /proc/meminfo)
    local cpus=$(nproc)
    log_info "CPU: ${cpus} cores, RAM: ${mem_gb}GB"

    [[ $mem_gb -lt 4 ]] && log_warn "Recommended: 4GB+ RAM"
    [[ $cpus -lt 2 ]] && log_warn "Recommended: 2+ CPUs"
}

install_deps() {
    log_step "Installing dependencies"

    apt-get update -qq
    apt-get install -y -qq curl wget jq open-iscsi nfs-common

    # Enable iscsid for Longhorn
    # https://longhorn.io/docs/latest/deploy/install/#installation-requirements
    systemctl enable iscsid --now

    log_success "Dependencies installed"
}

install_k3s() {
    log_step "Installing k3s"

    if command -v k3s &> /dev/null; then
        log_warn "k3s already installed: $(k3s --version | head -1)"
        read -r -p "Reinstall? (y/N): " choice
        [[ ! "$choice" =~ ^[Yy]$ ]] && return 0
        /usr/local/bin/k3s-uninstall.sh 2>/dev/null || true
    fi

    log_info "Installing k3s (--disable traefik,servicelb, --secrets-encryption)..."

    # https://docs.k3s.io/cli/server
    # https://docs.k3s.io/security/secrets-encryption
    curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server \
        --disable=traefik \
        --disable=servicelb \
        --secrets-encryption \
        --write-kubeconfig-mode=644" sh -

    # Wait for k3s
    local i=0
    while [[ $i -lt 30 ]]; do
        k3s kubectl get nodes &>/dev/null && break
        sleep 2 && ((i++))
    done

    [[ $i -eq 30 ]] && { log_error "k3s failed to start"; exit 1; }
    log_success "k3s installed"
}

setup_kubeconfig() {
    log_step "Setting up kubeconfig"

    local user="${SUDO_USER:-$USER}"
    local home=$(getent passwd "$user" | cut -d: -f6)
    local kube_dir="$home/.kube"

    mkdir -p "$kube_dir"
    cp /etc/rancher/k3s/k3s.yaml "$kube_dir/config"
    chown -R "$user:$user" "$kube_dir"
    chmod 600 "$kube_dir/config"

    # Symlink kubectl
    ln -sf /usr/local/bin/k3s /usr/local/bin/kubectl 2>/dev/null || true

    # Add to .bashrc
    local bashrc="$home/.bashrc"
    grep -q "KUBECONFIG=" "$bashrc" 2>/dev/null || cat >> "$bashrc" << 'EOF'

# Kubernetes
export KUBECONFIG=~/.kube/config
source <(kubectl completion bash)
alias k=kubectl
complete -o default -F __start_kubectl k
EOF

    log_success "kubeconfig ready: $kube_dir/config"
}

install_helm() {
    log_step "Installing Helm"

    if command -v helm &> /dev/null; then
        log_warn "Helm already installed: $(helm version --short)"
        return 0
    fi

    curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

    local user="${SUDO_USER:-$USER}"
    local bashrc="$(getent passwd "$user" | cut -d: -f6)/.bashrc"
    grep -q "helm completion" "$bashrc" 2>/dev/null || \
        echo 'source <(helm completion bash)' >> "$bashrc"

    log_success "Helm installed"
}

install_k9s() {
    log_step "Installing k9s"

    if command -v k9s &> /dev/null; then
        log_warn "k9s already installed"
        return 0
    fi

    local arch=$(uname -m)
    case $arch in
        x86_64) arch="amd64" ;;
        aarch64) arch="arm64" ;;
        *) log_error "Unsupported: $arch"; exit 1 ;;
    esac

    local version=$(curl -sL https://api.github.com/repos/derailed/k9s/releases/latest | jq -r '.tag_name')
    local url="https://github.com/derailed/k9s/releases/download/${version}/k9s_Linux_${arch}.tar.gz"

    curl -sL "$url" | tar xz -C /tmp k9s
    mv /tmp/k9s /usr/local/bin/
    chmod +x /usr/local/bin/k9s

    log_success "k9s installed: $version"
}

verify() {
    log_step "Verification"

    echo "Components:"
    echo "  k3s:     $(k3s --version 2>/dev/null | head -1 | awk '{print $3}' || echo 'N/A')"
    echo "  kubectl: $(kubectl version --client 2>/dev/null | grep -oP 'v[\d.]+' | head -1 || echo 'N/A')"
    echo "  helm:    $(helm version --short 2>/dev/null || echo 'N/A')"
    echo "  k9s:     $(k9s version --short 2>/dev/null || echo 'N/A')"
    echo ""
    kubectl get nodes
}

print_next() {
    local user="${SUDO_USER:-$USER}"

    echo ""
    echo "=========================================="
    echo "  Bootstrap complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Reload shell (run as $user, not root):"
    echo "     source ~/.bashrc"
    echo ""
    echo "  2. Verify:"
    echo "     kubectl get nodes"
    echo "     helm version"
    echo "     k9s"
    echo ""
    echo "  3. Install ArgoCD:"
    echo "     kubectl create namespace argocd"
    echo "     kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml"
    echo ""
    echo "  4. See infrastructure/README.md for full setup"
    echo ""
}

main() {
    echo ""
    echo "=========================================="
    echo "  K3s + Tools Bootstrap"
    echo "=========================================="

    check_root
    check_system
    install_deps
    install_k3s
    setup_kubeconfig
    install_helm
    install_k9s
    verify
    print_next
}

main "$@"
