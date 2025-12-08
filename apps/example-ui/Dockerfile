# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

ARG APP_VERSION=dev
ENV APP_VERSION=${APP_VERSION}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage - official unprivileged nginx image
# https://github.com/nginx/docker-nginx-unprivileged
FROM nginxinc/nginx-unprivileged:alpine

# Copy nginx config (must listen on 8080 for unprivileged)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets with correct ownership
COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script and make executable
COPY --chown=nginx:nginx docker/entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
