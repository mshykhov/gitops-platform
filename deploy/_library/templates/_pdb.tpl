{{- define "library.pdb.tpl" -}}
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
{{- end -}}

{{- define "library.pdb" -}}
{{- include "library.util.merge" (append . "library.pdb.tpl") -}}
{{- end -}}
