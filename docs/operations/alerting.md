# Alerting

## Architecture

```
VictoriaMetrics → VMAlert → VMAlertmanager → configured receivers
```

## Routing

Receiver routing is deployment-specific. Store receiver credentials in your
secret manager and add a `VMAlertmanagerConfig` or a managed configuration
after deciding which notification service you will operate.

## Test Alerts

### Send test critical alert

```bash
kubectl exec -n monitoring -it $(kubectl get pods -n monitoring -l app.kubernetes.io/name=vmalertmanager -o jsonpath='{.items[0].metadata.name}') -- \
  amtool alert add TestCriticalAlert severity=critical namespace=test \
  --annotation.summary="Test critical alert for Pushover"
```

### Send test via API

```bash
kubectl exec -n monitoring -it $(kubectl get pods -n monitoring -l app.kubernetes.io/name=vmalertmanager -o jsonpath='{.items[0].metadata.name}') -- \
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

Confirm the alert appears in VMAlertmanager and reaches the receiver you
configured. The repository does not ship notification credentials or a default
external receiver.
