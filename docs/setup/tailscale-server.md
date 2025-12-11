# Tailscale Server Setup

Setup Tailscale on your server to join the tailnet.

> **Docs**: https://tailscale.com/kb/1031/install-linux

---

## 1. Create Tailscale Account

1. Go to [tailscale.com](https://tailscale.com) and sign up
2. Note your tailnet name (e.g., `tail123456`) from the admin console

> [!TIP]
> **Change tailnet name now if needed!**
>
> Go to [Settings → General](https://login.tailscale.com/admin/settings/general) and update your **Tailnet name** before proceeding.
>
> Changing it later is complicated — it affects:
> - All machine hostnames (`*.ts.net`)
> - DNS records
> - Kubernetes ingress configurations
> - Saved bookmarks and scripts

## 2. Install Tailscale (Linux)

SSH to your server (via local network or provider console):

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

## 3. Connect to Tailnet

```bash
sudo tailscale up
```

Follow the link to authenticate with your Tailscale account.

## 4. Verify

```bash
tailscale status
```

Your server is now part of your tailnet.

---

## Optional: Tailscale SSH

Tailscale SSH allows secure SSH access without exposing port 22 to the internet.

> **Docs**: https://tailscale.com/kb/1193/tailscale-ssh

### Add SSH Policy to ACL

Open [ACL Editor](https://login.tailscale.com/admin/acls) and add:

```json
{
  "tagOwners": {
    "tag:server": ["autogroup:admin"]
  },

  "ssh": [
    {
      "action": "check",
      "src": ["autogroup:admin"],
      "dst": ["tag:server"],
      "users": ["autogroup:nonroot", "root"]
    }
  ]
}
```

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `action` | `check` | Browser prompt to confirm SSH session |
| `src` | `autogroup:admin` | Only admins can SSH |
| `dst` | `tag:server` | Only devices with `tag:server` |
| `users` | `nonroot, root` | Can login as ubuntu or root |

### Enable SSH on Server

```bash
sudo tailscale up --ssh --advertise-tags=tag:server
```

### Install Tailscale on Your Machine

- **macOS**: `brew install tailscale` or [download](https://tailscale.com/download/mac)
- **Windows**: [download](https://tailscale.com/download/windows)
- **Linux**: `curl -fsSL https://tailscale.com/install.sh | sh`

Connect to your tailnet:

```bash
tailscale up
```

### Connect to Server

Find your server's Tailscale hostname in [admin console](https://login.tailscale.com/admin/machines).

```bash
ssh user@<server-tailscale-hostname>
# or using Tailscale IP
ssh user@100.x.x.x
```

### Benefits

- No exposed SSH port (22) to internet
- No SSH key management needed
- Access from anywhere via Tailscale
- Automatic encryption via WireGuard

---

## Troubleshooting

### Cannot connect via SSH

1. Check both machines are in same tailnet:
   ```bash
   tailscale status
   ```

2. Check Tailscale SSH is enabled on server:
   ```bash
   tailscale status --self
   # Should show: offers: ssh
   ```

3. Re-enable SSH:
   ```bash
   sudo tailscale up --ssh
   ```

### Connection refused

Check Tailscale is running:
```bash
sudo systemctl status tailscaled
```

