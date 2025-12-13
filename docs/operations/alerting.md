# Alerting

## Architecture

```
Prometheus → AlertManager ─┬→ Telegram (all alerts by severity)
                           └→ Pushover (critical only, emergency priority)
```

## Routing

| Severity | Telegram | Pushover |
|----------|----------|----------|
| critical | topic #2 | emergency (priority 2), tugboat sound |
| warning  | topic #5 | - |
| info     | topic #7 | - |

## Test Alerts

### Send test critical alert

```bash
kubectl exec -n monitoring -it $(kubectl get pods -n monitoring -l app.kubernetes.io/name=alertmanager -o jsonpath='{.items[0].metadata.name}') -- \
  amtool alert add TestCriticalAlert severity=critical namespace=test \
  --annotation.summary="Test critical alert for Pushover"
```

### Send test via API

```bash
kubectl exec -n monitoring -it $(kubectl get pods -n monitoring -l app.kubernetes.io/name=alertmanager -o jsonpath='{.items[0].metadata.name}') -- \
  wget -q -O- --post-data='[
    {
      "labels": {
        "alertname": "TestCriticalAlert",
        "severity": "critical",
        "namespace": "test"
      },
      "annotations": {
        "summary": "Test critical alert",
        "description": "This is a test alert"
      }
    }
  ]' --header='Content-Type: application/json' \
  http://localhost:9093/api/v2/alerts
```

### Expected result

- Pushover: `🚨 smhomelab: TestCriticalAlert` (emergency, tugboat sound)
- Telegram: `🔴 TestCriticalAlert` (critical topic)

## Secrets (Doppler)

```
PUSHOVER_API_TOKEN  # Pushover application API token
PUSHOVER_USER_KEY   # Pushover user key
TELEGRAM_BOT_TOKEN  # Telegram bot token
```
