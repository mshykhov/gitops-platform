{{- define "library.externalsecret.tpl" -}}
{{- if and .Values.secrets.enabled .Values.secrets.data -}}
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: {{ include "library.fullname" . }}
  labels:
    {{- include "library.labels" . | nindent 4 }}
spec:
  refreshInterval: {{ .Values.secrets.refreshInterval | default "5m" }}
  secretStoreRef:
    kind: ClusterSecretStore
    name: {{ .Values.secrets.secretStore }}
  target:
    name: {{ include "library.fullname" . }}
    creationPolicy: Owner
  data:
    {{- range .Values.secrets.data }}
    - secretKey: {{ .secretKey }}
      remoteRef:
        key: {{ .remoteKey }}
    {{- end }}
{{- end -}}
{{- end -}}

{{- define "library.externalsecret" -}}
{{- include "library.util.merge" (append . "library.externalsecret.tpl") -}}
{{- end -}}
