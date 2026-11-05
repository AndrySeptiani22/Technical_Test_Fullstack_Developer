# Implementation Notes — Azatech Shop

## Architecture

- `backend/src/domain`: entities and domain rules, including order status transitions.
- `backend/src/application`: request/response models, Zod validators, repository contracts, and use cases.
- `backend/src/infrastructure`: TypeORM repositories, PostgreSQL configuration, and supporting adapters.
- `backend/src/presentation`: Express routes, authentication/permission middleware, error handling, audit middleware, and OpenAPI.
- `frontend/src`: Vue/TypeScript presentation, application use cases and validation, domain contracts, and infrastructure repositories.

## Implemented backend behavior

- Order creation, stock reservation, stock movement, order history, and idempotency response are persisted in a PostgreSQL transaction. Product rows are locked in ascending ID order before stock is validated.
- Idempotency keys are unique per user. The request payload is hashed, and the original successful response is persisted for replay.
- Order transitions are validated by a domain state machine. Cancellation restores stock and records its movement in the same transaction.
- Stock adjustments use a transaction and row lock, reject a negative resulting stock, and record a stock movement.
- Authentication uses bcrypt passwords, short-lived JWT access tokens, opaque refresh tokens stored as hashes, token rotation, and reuse revocation.
- Endpoints use strict Zod request validation and permission middleware. API audit metadata stores a sanitized request-body representation; sensitive values are redacted and the payload is bounded.
- Sales and top-product reports use TypeORM query aggregation. Dashboard summary reads PostgreSQL; it does not currently use a Redis cache.

## API documentation

The OpenAPI 3.0.3 definition is maintained in `backend/src/presentation/swagger/openapi.ts`, served at `/api-docs.json`, and rendered by Swagger UI at `/api-docs`. Keep route parameters, request bounds, response shapes, permissions, and examples aligned with endpoint validators and implementations. The definition is hand-maintained rather than generated from Zod, so it can drift; review it whenever a route or validator changes.

## Docker Compose

The repository-root `compose.yaml` runs PostgreSQL, the backend, and the Nginx frontend. The backend image is built from `backend/Dockerfile`; the frontend image builds the Vite app and serves its static output. Nginx proxies `/api` to the backend service. PostgreSQL schema and seed scripts are mounted into the image's initialization directory and run only when the data volume is empty. The named `postgres_data` volume persists database contents across restarts.

Set `POSTGRES_PASSWORD` and an `APP_JWT_SECRET` of at least 32 characters in the root `.env` file before starting Compose. `docker compose down --volumes` removes persisted database contents.

## Verification recorded for the Docker/API-documentation update

- Backend `npm run build`: passed.
- Frontend `npm run build`: passed.
- `docker compose config`: passed.
- `docker compose build`: backend and frontend images built.
- `git diff --check`: passed.
- The Compose services were not started together for a live database/API smoke test.

The backend has unit/use-case, request-validation, endpoint-handler/contract, and audit-metadata tests. These do not replace integration testing with a real PostgreSQL instance.

## Remaining work

1. If asynchronous email/invoice delivery is required, add a queue (for example BullMQ + Redis), a worker, retry/backoff, and an email test service. Current notification records do not constitute a running delivery worker.
2. If dashboard load requires it, add Redis caching and explicit invalidation for all mutations that affect the summary. Redis is not currently configured or checked by health endpoints.
3. Add CI to run backend tests, lint, type-check, builds, and frontend validation.
4. Add automated checks that compare the OpenAPI document with route/validator contracts, or generate more of the document from shared schemas to reduce drift.
