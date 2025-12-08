{{/*
Base Service template
*/}}
{{- define "library.service.tpl" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "library.fullname" . }}
  labels:
    {{- include "library.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "library.selectorLabels" . | nindent 4 }}
{{- end -}}

{{- define "library.service" -}}
{{- include "library.util.merge" (append . "library.service.tpl") -}}
{{- end -}}
