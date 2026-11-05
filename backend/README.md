# Azatech Shop API

Backend Node.js untuk Online Shop / Order Management. Project mengikuti struktur yang sudah ada: `domain`, `application`, `infrastructure`, dan `presentation`, menggunakan Express, TypeScript strict, TypeORM, serta PostgreSQL.
Model request, Zod validator, dan formatter/tipe response endpoint berada terpisah di `src/application/models/requests`, `src/application/models/validators`, dan `src/application/models/response`.

## Menjalankan aplikasi

1. Salin `.env.example` menjadi `.env`, lalu isi kredensial PostgreSQL dan `APP_JWT_SECRET` (minimal 32 karakter).
2. Install dependency: `npm install`.
3. Jalankan schema dan seed dari folder repository:

   ```bash
   psql -d azatech_database -f database/azatech_database.sql
   psql -d azatech_database -f database/azatech_seed.sql
   ```

4. Jalankan API: `npm start`.

API menggunakan prefix `/api`. Health check tersedia pada `/api/health` dan `/health`.
Swagger UI tersedia di `/api-docs`, dengan spesifikasi OpenAPI JSON di `/api-docs.json`. Gunakan tombol **Authorize** dan access token JWT dari endpoint login untuk mencoba endpoint terproteksi.

Akun seed lokal: `admin@azatech.id` / `Admin#12345` dan `cashier@azatech.id` / `Cashier#12345`. Ganti password tersebut sebelum penggunaan di luar lingkungan lokal.

## Endpoint utama

| Area         | Endpoint                                                               | Akses                                                    |
| ------------ | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Auth         | `POST /api/auth/login`, `/refresh`, `/logout`, `GET /me`               | Login/refresh publik; logout/me terautentikasi           |
| Products     | `GET/POST /api/products`, `GET/PUT/DELETE /:id`                        | Permission-based; mutasi admin                           |
| Stock        | `POST /api/products/:id/stock-adjustments`, `GET /:id/stock-movements` | Admin                                                    |
| Customers    | `GET/POST /api/customers`, `GET/PUT/DELETE /:id`                       | Cashier dapat melihat, membuat, dan update; delete admin |
| Orders       | `GET/POST /api/orders`, `GET /:id`                                     | Admin/cashier sesuai permission                          |
| Order status | `POST /api/orders/:id/pay`, `/ship`, `/complete`, `/cancel`            | Pay admin/cashier; aksi lain admin                       |
| Invoice      | `GET /api/orders/:id/invoice`                                          | Admin/cashier setelah order paid; format HTML            |
| Dashboard    | `GET /api/dashboard/summary`                                           | Role yang punya `dashboard.view`                         |
| Reports      | `GET /api/reports/sales`, `/top-products`                              | Admin                                                    |

Semua endpoint terproteksi memakai `Authorization: Bearer <accessToken>`. Order creation menerima JSON `{ customer_id, items: [{ product_id, quantity }] }` dan wajib menyertakan header `Idempotency-Key` berisi UUID. Harga dan total selalu dihitung dari produk di database.

List endpoint mendukung `page`, `limit`, `search`, `sort_by`, dan `sort_order` (sort hanya pada kolom yang diizinkan). Sales report menerima `from`, `to`, dan `group_by=day|month`; top products menerima `from`, `to`, dan `limit`.
Body, query, path parameter, dan header input yang digunakan endpoint divalidasi menggunakan Zod.

## Implementasi inti technical test

- Pembuatan order, item, reservasi stok, stock ledger, status history, dan idempotency disimpan dalam satu transaksi PostgreSQL.
- Product rows dikunci dengan `SELECT ... FOR UPDATE` melalui pessimistic write lock, diurutkan berdasarkan `PRODUCT_ID` sebelum diproses. Ini menjaga stok agar tidak oversell dan memberi urutan lock konsisten untuk mengurangi deadlock.
- `Idempotency-Key` unik per user, request payload di-hash dengan SHA-256, masa berlaku 24 jam, dan response sukses asli disimpan sebagai snapshot JSONB agar replay mengembalikan payload/status awal yang sama.
- State machine order berada di `src/domain/services/order-state-machine.ts`. Transisi invalid menghasilkan HTTP 409; role yang tidak berhak menghasilkan 403.
- Pembatalan mengunci order lebih dulu, memvalidasi status, kemudian mengembalikan stok dan menambah ledger `CANCEL_RESTORE` dalam transaksi yang sama. Request cancel kedua ditolak oleh state machine.
- Stock adjustment menggunakan transaksi + row lock, menolak stok negatif, dan menulis ledger. Pembuatan produk dengan stok awal juga menulis ledger `INITIAL`.
- Login memakai bcrypt, access token berumur pendek, refresh token opaque yang disimpan sebagai SHA-256 hash, rotasi refresh token, dan revokasi satu token family saat mendeteksi reuse.
- Low-stock notifications dicatat untuk admin saat stok melewati ambang batas. Saat order dibayar, sebuah notification/outbox record untuk invoice email dibuat dengan dedupe key per order.
- Reporting memakai agregasi TypeORM QueryBuilder untuk menghindari N+1 query; dashboard membaca data melalui repository TypeORM. Nomor invoice tetap dibuat oleh trigger database saat order dimasukkan melalui TypeORM. API audit menggunakan request ID dari `X-Request-Id` bila valid, atau membuat request ID baru.
- Setiap request API dicatat pada `AUDIT_API`; aset statis Swagger tidak dicatat, sedangkan tampilan `/api-docs` menghasilkan satu record. Login, refresh, dan logout dicatat sebagai event `AUTHENTICATION` pada `AUDIT_LOGS` (login gagal juga dicatat). Nilai `AUDIT_API.USER_AGENT` menyimpan nama dan versi browser hasil parsing (misalnya `Chrome/156.0.0.0`), bukan seluruh header User-Agent.

## Testing

- `npm test` menjalankan unit test domain untuk perhitungan total dan state machine.
- `npm run typecheck`, `npm run lint`, dan `npm run build` tersedia.
- Unit test domain tidak menggantikan integration test pada PostgreSQL. Uji paralel 20 request terhadap stok 5, idempotency race, dan pembatalan paralel masih perlu dijalankan terhadap database PostgreSQL nyata sebelum dinyatakan lulus.

## Batasan yang masih perlu diselesaikan untuk memenuhi seluruh test

Implementasi ini menambahkan alur bisnis utama ke backend yang diberikan, tetapi belum mengklaim seluruh deliverable technical test selesai:

1. BullMQ + Redis belum di-wire. Invoice/low-stock notification sudah dicatat sebagai outbox-style notification, tetapi worker retry/backoff, pembuatan PDF, dan pengiriman SMTP/Mailpit belum dibuat.
2. Redis cache dashboard dan strategi invalidasinya belum diimplementasikan; dashboard summary saat ini dihitung dari PostgreSQL.
3. Health check saat ini memeriksa PostgreSQL saja karena koneksi Redis belum ditambahkan.
4. Belum ada integration test concurrency/idempotency terhadap PostgreSQL sungguhan.
5. OpenAPI/Swagger, Docker Compose, Dockerfile, GitHub Actions, dan frontend berada di luar archive backend yang diberikan dan belum dibuat di sini.

Lihat `IMPLEMENTATION_NOTES.md` untuk keputusan teknis dan tindak lanjut.
