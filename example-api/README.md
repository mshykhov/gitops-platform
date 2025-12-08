# Example API

Spring Boot REST API with OAuth2/JWT authentication, PostgreSQL, and Redis caching.

## Tech Stack

- Java 21, Kotlin, Gradle
- Spring Boot 3.4, Spring Data JPA
- Spring Security + OAuth2 Resource Server (JWT)
- PostgreSQL, Redis, Flyway
- Docker (eclipse-temurin)

## Quick Start

```bash
# Start PostgreSQL and Redis
docker compose up -d

# Configure environment
cp .env.example .env
# Edit .env with your Auth0 credentials

# Run application
./gradlew bootRun
```

Open http://localhost:8080

**Swagger UI**: http://localhost:8080/swagger-ui.html

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|:--------:|---------|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | Yes | `jdbc:postgresql://localhost:5432/example_api` |
| `SPRING_DATASOURCE_USERNAME` | Database username | Yes | `example_api` |
| `SPRING_DATASOURCE_PASSWORD` | Database password | Yes | `example_api` |
| `AUTH0_DOMAIN` | OAuth2 issuer domain | Yes | `dev-abc123.us.auth0.com` |
| `AUTH0_AUDIENCE` | OAuth2 API identifier | Yes | `https://api.example.com` |
| `SPRING_DATA_REDIS_HOST` | Redis host | No | `localhost` |
| `SPRING_DATA_REDIS_PORT` | Redis port | No | `6379` |
| `SERVER_PORT` | HTTP port | No | `8080` |

### Example `.env` (local development)

```bash
# Database (provided by docker compose)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/example_api
SPRING_DATASOURCE_USERNAME=example_api
SPRING_DATASOURCE_PASSWORD=example_api

# Auth0 credentials (replace with your values)
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_AUDIENCE=https://api.example.com
```

## Scripts

| Command | Description |
|---------|-------------|
| `./gradlew bootRun` | Start dev server at http://localhost:8080 |
| `./gradlew build` | Build JAR |
| `./gradlew test` | Run tests |

## Docker

```bash
docker build -t example-api .

docker run -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host:5432/db \
  -e SPRING_DATASOURCE_USERNAME=user \
  -e SPRING_DATASOURCE_PASSWORD=pass \
  -e AUTH0_DOMAIN=dev-abc123.us.auth0.com \
  -e AUTH0_AUDIENCE=https://api.example.com \
  example-api
```

## Auth0 Setup

See [Auth0 Setup Guide](../docs/auth0-setup.md) for detailed instructions.

**Quick summary**: Create API in Auth0 Dashboard, copy `Domain` → `AUTH0_DOMAIN` and `Identifier` → `AUTH0_AUDIENCE`.

## API Endpoints

### Public (no auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/health` | Health check |
| GET | `/api/public/info` | App info |
| GET | `/actuator/health` | K8s probes |
| GET | `/actuator/prometheus` | Metrics |

### Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Current user info |
| GET | `/api/items` | List items (paginated) |
| GET | `/api/items/{id}` | Get item |
| POST | `/api/items` | Create item |
| PUT | `/api/items/{id}` | Update item |
| DELETE | `/api/items/{id}` | Delete item |

### Admin (`admin` role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Server stats |

## CI/CD

GitHub Actions workflow (`.github/workflows/release.yaml`) builds and pushes Docker image on semver tags.

**Trigger**: Push tag `v*.*.*` (e.g., `v1.0.0`, `v1.0.0-beta.1`)

**Required secrets**: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` ([setup guide](../docs/github-secrets.md))

```bash
# Create release
git tag v1.0.0
git push origin v1.0.0
```

## Configuration

| Environment | Config Source | Mechanism |
|-------------|---------------|-----------|
| Development | `.env` file | Spring Boot `@Value` |
| Production | Env vars | K8s ConfigMap/Secret |

## Project Structure

```
src/main/kotlin/org/example/exampleapi/
├── config/        # Security, CORS, OpenAPI
├── controller/    # REST controllers
├── dto/           # Request/Response DTOs
├── entity/        # JPA entities
├── exception/     # Error handling
├── repository/    # Spring Data repositories
└── service/       # Business logic
```

## License

MIT
