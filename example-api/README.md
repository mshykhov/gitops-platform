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
docker compose up -d
cp .env.example .env
# Edit .env with your values
./gradlew bootRun
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | Yes |
| `SPRING_DATASOURCE_USERNAME` | Database username | Yes |
| `SPRING_DATASOURCE_PASSWORD` | Database password | Yes |
| `AUTH0_DOMAIN` | OAuth2 issuer domain | Yes |
| `AUTH0_AUDIENCE` | OAuth2 API identifier | Yes |
| `SPRING_DATA_REDIS_HOST` | Redis host | No |
| `SPRING_DATA_REDIS_PORT` | Redis port | No |
| `SERVER_PORT` | HTTP port (default: 8080) | No |

### Example `.env`

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/example_api
SPRING_DATASOURCE_USERNAME=example_api
SPRING_DATASOURCE_PASSWORD=example_api
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

> **Docs**: [Auth0 API Authorization](https://auth0.com/docs/get-started/apis)

### 1. Create API

1. Go to [Auth0 Dashboard](https://manage.auth0.com/) → Applications → APIs → Create API
2. Set **Name** (e.g., `Example API`)
3. Set **Identifier** (e.g., `https://api.example.com`)

### 2. Copy Credentials

- **Domain** → `AUTH0_DOMAIN` (e.g., `dev-abc123.us.auth0.com`)
- **Identifier** → `AUTH0_AUDIENCE` (e.g., `https://api.example.com`)

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
