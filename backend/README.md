# Azatech Shop API

This Express API uses PostgreSQL tables from `database/azatech_database.sql`.
Apply that script to the `azatech_database` database before starting the API.

## Setup

1. Copy `.env.example` to `.env` and set your database credentials and a random
   `APP_JWT_SECRET` of at least 32 characters.
2. From this folder, install dependencies with `npm install`.
3. Apply the database script from the repository root:
   `psql -d azatech_database -f database/azatech_database.sql`
4. Create an initial administrator by setting `SUPERUSER_EMAIL` and
   `SUPERUSER_PASSWORD` in `.env`, then running `npm run bootstrap:superuser`.
5. Start the server with `npm start`.

The API listens on `/api/v1`; the database health check is `/health`.

## API areas

- Authentication: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`,
  `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- Products and stock: `/api/v1/products`
- Customers: `/api/v1/customers`
- Orders and transitions: `/api/v1/orders`
- Dashboard and reports: `/api/v1/dashboard`, `/api/v1/reports/*`
- Administration: `/api/v1/users`, `/api/v1/roles`, `/api/v1/permissions`
- Notifications and audit: `/api/v1/notifications`, `/api/v1/audit/*`

Protected endpoints require `Authorization: Bearer <accessToken>`.
Order creation requires a UUID `Idempotency-Key` header. List endpoints accept
`page` and `limit` query parameters.
