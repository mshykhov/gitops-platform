# Telegram Setup

Telegram bot for alerts from ArgoCD and Alertmanager.

> **Official Docs**: https://core.telegram.org/bots

## 1. Create Bot

1. Open Telegram, find [@BotFather](https://t.me/BotFather)
2. Send `/newbot`
3. Enter bot name (e.g., `MyProject Alerts`)
4. Enter username (e.g., `myproject_alerts_bot`)
5. **Save the token** → `TELEGRAM_BOT_TOKEN` for Doppler

## 2. Create Group with Topics

1. Create new group (e.g., `MyProject Alerts`)
2. Go to group settings → **Topics** → Enable
3. Create topics:
   - `Critical` — critical alerts
   - `Warning` — warnings
   - `Info` — informational
   - `Deploys` — deployment notifications

## 3. Add Bot to Group

1. Open group → Add members → Search your bot
2. Make bot **admin** (required for posting to topics)

## 4. Get Chat ID and Topic IDs

1. Send any message to each topic
2. Open in browser:
   ```
   https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates
   ```
3. Find in response:
   - `chat.id` → Chat ID (negative number like `-100XXXXXXXXXX`)
   - `message_thread_id` for each topic → topic IDs

Example response:
```json
{
  "message": {
    "chat": {"id": -1001234567890},
    "message_thread_id": 2,
    "text": "test"
  }
}
```

## 5. Add to Doppler

Add to `shared` config:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather |

## 6. Update values.yaml

```yaml
global:
  telegram:
    chatId: "-1001234567890"
    topics:
      critical: "2"
      warning: "3"
      info: "4"
      deploys: "5"
```

## Verification

After deployment, trigger a test alert:

```bash
# Check ArgoCD notifications
kubectl logs -n argocd -l app.kubernetes.io/name=argocd-notifications-controller

# Manual test (from argocd-notifications)
argocd admin notifications trigger telegram-alerts --resource app:argocd/apps
```

## Troubleshooting

### Bot not posting

1. Check bot is admin in the group
2. Check `TELEGRAM_BOT_TOKEN` in Doppler
3. Check chat ID is correct (negative number)

### Wrong topic

1. Verify `message_thread_id` matches topic
2. Send test message to topic and check `/getUpdates` again
