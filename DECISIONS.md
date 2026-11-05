# Technical Decisions

This summary reflects the current implementation and recorded project history. The repository owner should validate it and be prepared to explain the trade-offs in their own words.

## a. Bagaimana stok minus dicegah ketika dua order masuk bersamaan?

Pembuatan order mengunci semua product row yang diperlukan menggunakan pessimistic write lock (`FOR UPDATE`), dengan urutan berdasarkan product ID. Stok dibaca dan divalidasi setelah lock didapat; order, item, pengurangan stok, movement, history, dan idempotency response ditulis dalam transaksi yang sama. Jika validasi gagal, transaksi dibatalkan, sehingga tidak ada pengurangan stok parsial.

Penguncian ini mencegah dua transaksi yang bersaing memakai stok awal yang sama. Namun, perilaku paralel tersebut tetap perlu dibuktikan melalui integration test pada PostgreSQL sungguhan.

Referensi: `backend/src/infrastructure/repositories/order.repository.ts`, `createWithStockReservation`.

## b. Mengapa struktur folder dan lapisan kode seperti ini?

Struktur domain, application, infrastructure, dan presentation dipertahankan. Endpoint menangani HTTP, validasi Zod, permission, dan response; use case mengorkestrasi alur aplikasi; kontrak repository dipisahkan dari implementasi TypeORM; aturan domain seperti transisi status order berada di domain service.

Referensi: `backend/src/domain`, `backend/src/application`, `backend/src/infrastructure`, dan `backend/src/presentation`.

## c. Masalah integrasi yang ditemukan

Request update customer pernah mengirim field response `id`, `created_at`, dan `updated_at`. Karena validator update bersifat strict, backend menolak field yang bukan bagian dari request dengan validation error. Form frontend diperbaiki agar hanya mengirim field customer yang dapat diubah; validasi backend tetap dipertahankan.

Pelajaran: bentuk payload update harus mengikuti kontrak request, bukan menyalin seluruh object response.

## d. Pilihan tambahan

- **Idempotency:** Gunakan tabel PostgreSQL dan unique constraint per user/key, bukan cache in-memory. Hash payload digunakan untuk menolak key yang sama dengan payload berbeda; response awal disimpan agar replay menghasilkan response konsisten.
- **OpenAPI:** Spesifikasi OpenAPI 3 disimpan sebagai object TypeScript dan disajikan di `/api-docs` serta `/api-docs.json`. Ini menghindari dokumen endpoint yang terpisah dari kode, tetapi tetap memerlukan review terhadap validator dan route setiap kali kontrak berubah.
- **Docker Compose:** PostgreSQL, backend, dan frontend dijalankan sebagai service terpisah. Frontend Nginx mem-proxy `/api`; data PostgreSQL berada pada named volume. Schema dan seed hanya dijalankan otomatis saat volume database pertama kali dibuat.

## e. Batasan dan langkah berikutnya

Belum ada integration test concurrency/idempotency yang menggunakan PostgreSQL sungguhan. Redis, BullMQ, worker email/invoice, dashboard cache, dan CI juga belum diimplementasikan. Lihat `IMPLEMENTATION_NOTES.md` untuk daftar tindak lanjut.
