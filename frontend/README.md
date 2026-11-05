# Azatech Shop — Vue 3 Frontend

A production-shaped order management console built with **Vue 3 + TypeScript + Vite**, styled with **Tailwind CSS + shadcn-vue** patterns, and organized as a **Clean Architecture** frontend. API calls use **Axios** and connect to the Azatech Shop backend.

## Clean Architecture Layers

```
src/
├── domain/                 # Entities & repository interfaces (pure TS)
│   ├── entities/           # Auth, customer, order, product, report, and shared types
│   └── repositories/       # Per-domain repository contracts and list query types
├── application/            # Use cases and application-level constants
│   ├── constants/
│   │   └── order.constants.ts
│   └── use-cases/          # Auth, customer, order, product, and report modules
├── infrastructure/         # Concrete adapters
│   ├── http/
│   │   └── client.ts       # Axios instance + interceptors + bearer token
│   └── repositories/       # Per-domain Axios adapters, query helpers, and container
└── presentation/           # Vue views, components, stores, router
    ├── views/              # Feature pages and feature-specific components
    │   ├── product/        # index.vue plus page/detail.vue and component/grid.vue
    │   ├── customer/       # index.vue
    │   ├── order/          # index.vue plus page/create.vue and page/detail.vue
    │   ├── dashboard/      # index.vue
    │   ├── report/         # index.vue
    │   ├── login/          # index.vue
    │   └── layout/         # index.vue
    ├── components/ui/      # Shared Button, Input, Card, Modal, StatusBadge, Toaster
    ├── stores/             # Pinia stores for auth and feature page data
    ├── lib/                # utils (cn, formatIDR, …), toast helper
    └── router.ts
```

## Features

- **Auth**: JWT-style bearer tokens, refresh token rotation, role-aware navigation.
- **Products**: CRUD, pagination (5/10/20/all rows), search, sort, soft-delete, stock adjustments with movement ledger.
- **Customers**: CRUD, pagination (5/10/20/all rows), search.
- **Orders**: Multi-item creation with server-side price snapshot, idempotency-key header, status timeline, state machine (PENDING → PAID → SHIPPED → COMPLETED, or CANCELLED with stock restore), and selectable grid page sizes.
- **Dashboard & Reports**: Monthly summary, sales over time (day/month), top products.
- **Permissions**: Admin (full) vs Staff (no product writes / no reports).

## Demo credentials

| Role  | Email              | Password      |
| ----- | ------------------ | ------------- |
| Admin | admin@azatech.id   | Admin#12345   |
| Staff | cashier@azatech.id | Cashier#12345 |

## Run

### Docker Compose

From the repository root, copy `.env.example` to `.env`, set a database password and an `APP_JWT_SECRET` of at least 32 characters, then run:

```bash
docker compose up --build
```

Open `http://localhost:8080`. Nginx serves the production frontend and proxies `/api` requests to the backend container. The Compose stack initializes PostgreSQL from the schema and seed scripts on first startup.

### Local development

```bash
yarn install
yarn start   # http://localhost:3000
```

Start the backend separately (`backend` folder, `npm start`). Vite proxies `/api` to `http://127.0.0.1:1919` by default, matching the backend's default port. Set `VITE_BACKEND_URL` in the frontend environment if the backend is hosted elsewhere. To call a backend directly without the Vite proxy, set `VITE_API_BASE_URL` to its `/api` base URL; configure the backend's `CORS_ORIGINS` to allow the frontend origin.

## API contract

The Axios repositories call the backend's auth, products, stock, customers, orders, dashboard, reports, and invoice endpoints. Grid filters are sent as JSON request bodies with POST to the products, customers, and orders `/filter` endpoints. Access and refresh tokens are stored in browser local storage after login.

Repositories are split by domain (`auth`, `product`, `customer`, `order`, and `dashboard`) and composed through `infrastructure/repositories/index.ts`. Feature Pinia stores own list/report query state and invoke use cases so view components stay focused on rendering and interaction.
