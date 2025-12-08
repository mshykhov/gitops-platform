{{/*
PodDisruptionBudget template
Docs: https://kubernetes.io/docs/tasks/run-application/configure-pdb/
Auto-enabled when replicaCount > 1, can be disabled with pdb.enabled=false
*/}}
{{- define "library.pdb" -}}
{{- $pdbEnabled := true }}
{{- if .Values.pdb }}
  {{- if eq .Values.pdb.enabled false }}
    {{- $pdbEnabled = false }}
  {{- end }}
{{- end }}
{{- if and $pdbEnabled (gt (int .Values.replicaCount) 1) }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "library.fullname" . }}
  labels:
    {{- include "library.labels" . | nindent 4 }}
spec:
  {{- if and .Values.pdb .Values.pdb.minAvailable }}
  minAvailable: {{ .Values.pdb.minAvailable }}
  {{- else if and .Values.pdb .Values.pdb.maxUnavailable }}
  maxUnavailable: {{ .Values.pdb.maxUnavailable }}
  {{- else }}
  minAvailable: 1
  {{- end }}
  selector:
    matchLabels:
      {{- include "library.selectorLabels" . | nindent 6 }}
{{- end }}
{{- end }}
