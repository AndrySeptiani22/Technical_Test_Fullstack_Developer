# Azatech Shop — Vue 3 Frontend

A production-shaped order management console built with **Vue 3 + TypeScript + Vite**, styled with **Tailwind CSS + shadcn-vue** patterns, and organized as a **Clean Architecture** frontend. API calls use **Axios** and connect to the Azatech Shop backend.

## Clean Architecture Layers

```
src/
├── domain/                 # Entities & repository interfaces (pure TS)
│   ├── entities.ts         # Product, Customer, Order, OrderStatus, …
│   └── repositories.ts     # IAuthRepository, IProductRepository, …
├── application/            # Use cases (framework-free orchestration)
│   └── use-cases.ts
├── infrastructure/         # Concrete adapters
│   ├── http/
│   │   └── client.ts       # Axios instance + interceptors + bearer token
│   └── repositories/       # Axios-based repo implementations + container
└── presentation/           # Vue views, components, stores, router
    ├── views/              # Login, Dashboard, Products, Customers, Orders, Reports
    ├── components/ui/      # Button, Input, Card, Modal, StatusBadge, Toaster
    ├── stores/             # Pinia store (auth)
    ├── lib/                # utils (cn, formatIDR, …), toast helper
    └── router.ts
```

## Features

- **Auth**: JWT-style bearer tokens, refresh token rotation, role-aware navigation.
- **Products**: CRUD, pagination, search, sort, soft-delete, stock adjustments with movement ledger.
- **Customers**: CRUD, pagination, search.
- **Orders**: Multi-item creation with server-side price snapshot, idempotency-key header, status timeline, state machine (PENDING → PAID → SHIPPED → COMPLETED, or CANCELLED with stock restore).
- **Dashboard & Reports**: Monthly summary, sales over time (day/month), top products.
- **Permissions**: Admin (full) vs Staff (no product writes / no reports).

## Demo credentials

| Role  | Email             | Password |
| ----- | ----------------- | -------- |
| Admin | admin@example.com | admin123 |
| Staff | staff@example.com | staff123 |

## Run

```bash
yarn install
yarn start   # http://localhost:3000
```

Start the backend separately (`backend` folder, `npm start`). Vite proxies `/api` to `http://127.0.0.1:1919` by default, matching the backend's default port. Set `VITE_BACKEND_URL` in the frontend environment if the backend is hosted elsewhere. To call a backend directly without the Vite proxy, set `VITE_API_BASE_URL` to its `/api` base URL; configure the backend's `CORS_ORIGINS` to allow the frontend origin.

## API contract

The Axios repositories call the backend's auth, products, stock, customers, orders, dashboard, reports, and invoice endpoints. Access and refresh tokens are stored in browser local storage after login.
