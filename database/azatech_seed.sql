CREATE EXTENSION IF NOT EXISTS pgcrypto; 

DO $seed$
DECLARE
    v_admin    uuid;
    v_cashier  uuid;
    v_cust     uuid[];
    v_prod     bigint[];
    r          record;
    tg         record;
    v_order_id bigint;
    n_users int; n_products int; n_customers int; n_orders int; n_audit int;
BEGIN
    IF EXISTS (SELECT 1 FROM "USERS") THEN
        RAISE NOTICE 'Seed skipped: users table is not empty.';
        RETURN;
    END IF;

    PERFORM setseed(0.2026);

    CREATE TEMP TABLE seed_audit_triggers ON COMMIT DROP AS
    SELECT c.relname::text AS tbl, t.tgname::text AS trg
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE t.tgfoid = to_regproc('audit_row_change')
      AND NOT t.tgisinternal
      AND t.tgenabled <> 'D'
      AND pg_table_is_visible(c.oid);

    FOR tg IN SELECT * FROM seed_audit_triggers LOOP
        EXECUTE format('ALTER TABLE %I DISABLE TRIGGER %I', tg.tbl, tg.trg);
    END LOOP;

    INSERT INTO "USERS" ("NAME", "EMAIL", "PASSWORD", "ROLE_ID", "CREATED_AT", "UPDATED_AT")
    VALUES ('Admin Azatech', 'admin@azatech.id', crypt('Admin#12345', gen_salt('bf', 10)),
            (SELECT "ROLE_ID" FROM "ROLES" WHERE "CODE" = 'admin'),
            now() - interval '100 days', now() - interval '100 days')
    RETURNING "USER_ID" INTO v_admin;

    INSERT INTO "USERS" ("NAME", "EMAIL", "PASSWORD", "ROLE_ID", "CREATED_AT", "UPDATED_AT")
    VALUES ('Kasir Azatech', 'cashier@azatech.id', crypt('Cashier#12345', gen_salt('bf', 10)),
            (SELECT "ROLE_ID" FROM "ROLES" WHERE "CODE" = 'cashier'),
            now() - interval '100 days', now() - interval '100 days')
    RETURNING "USER_ID" INTO v_cashier;

    INSERT INTO "PRODUCTS" ("PRODUCT_CODE", "PRODUCT_NAME", "PRICE", "LOW_STOCK_THRESHOLD", "CREATED_AT", "UPDATED_AT")
    SELECT 'P' || lpad(t.n::text, 4, '0'),
           t."NAME",
           t."PRICE",
           CASE t.n % 4 WHEN 0 THEN 10 WHEN 1 THEN 5 WHEN 2 THEN 8 ELSE 5 END,
           now() - interval '100 days',
           now() - interval '100 days'
    FROM (
        SELECT row_number() OVER () AS n, "NAME", "PRICE"
        FROM (VALUES
            ('Hydrococo 150ml',                12000.00),
            ('Teh Botol Sosro 450ml',           5500.00),
            ('Air Mineral 600ml',               4000.00),
            ('Mie Instan Goreng 85g',           3500.00),
            ('Kopi Bubuk 165g',                14500.00),
            ('Gula Pasir 1kg',                 17500.00),
            ('Minyak Goreng 2L',               38000.00),
            ('Beras Premium 5kg',              72000.00),
            ('Susu UHT Full Cream 1L',         19500.00),
            ('Sabun Mandi Batang 100g',         3500.00),
            ('Shampoo Anti Ketombe 170ml',     27500.00),
            ('Pasta Gigi 190g',                15500.00),
            ('Deterjen Bubuk 800g',            24500.00),
            ('Pembersih Lantai 780ml',         18500.00),
            ('Tisu Wajah 250 Lembar',          15000.00),
            ('Biskuit Kelapa 300g',            12500.00),
            ('Wafer Cokelat 130g',              9500.00),
            ('Keripik Kentang 68g',            11500.00),
            ('Cokelat Batang 58g',             14000.00),
            ('Mie Instan Soto 75g',             3300.00),
            ('Kecap Manis 520ml',              16500.00),
            ('Saus Sambal 275ml',              11000.00),
            ('Tepung Terigu 1kg',              14000.00),
            ('Telur Ayam 1kg',                 29000.00),
            ('Sarden Kaleng 155g',             13500.00),
            ('Kornet Sapi 198g',               24500.00),
            ('Teh Celup 25 Kantong',            7500.00),
            ('Kopi Instan Cappuccino 5 Sachet',11500.00),
            ('Minuman Sereal Cokelat 5 Sachet',12500.00),
            ('Oatmeal 400g',                   38500.00),
            ('Madu Murni 250ml',               45000.00),
            ('Sirup Melon 460ml',              21500.00),
            ('Air Mineral 1.5L',                6500.00),
            ('Jus Jeruk 250ml',                 7500.00),
            ('Minuman Probiotik 5 Botol',      11000.00),
            ('Roti Tawar Gandum',              16000.00),
            ('Margarin 200g',                  12500.00),
            ('Keju Cheddar 165g',              28000.00),
            ('Sosis Ayam 360g',                36000.00),
            ('Nugget Ayam 500g',               52000.00),
            ('Baterai AA 4 Pcs',               18500.00),
            ('Lampu LED 9 Watt',               29000.00),
            ('Korek Api Gas',                   3500.00),
            ('Pulpen Hitam Standar',            3000.00),
            ('Buku Tulis 38 Lembar',            5500.00),
            ('Pensil 2B',                       4500.00),
            ('Sikat Gigi Dewasa',               6500.00),
            ('Masker Medis 50 Pcs',            25000.00),
            ('Hand Sanitizer 50ml',            14500.00),
            ('Vitamin C 500mg 10 Tablet',       9500.00)
        ) AS v("NAME", "PRICE")
    ) t;

    INSERT INTO "CUSTOMERS" ("CUSTOMER_NAME", "CUSTOMER_ADDRESS", "GENDER", "BIRTH_DATE", "PHONE", "EMAIL",
                           "CREATED_AT", "UPDATED_AT")
    SELECT c."NAME", c.address, c."GENDER"::customer_gender, c."BIRTH_DATE",
           CASE WHEN c.n % 9 = 0 THEN NULL
                ELSE '0812' || lpad(((c.n * 7311 + 12345678) % 100000000)::text, 8, '0') END,
           CASE WHEN c.n % 6 = 0 THEN NULL
                ELSE lower(replace(c."NAME", ' ', '.')) || '@example.com' END,
           now() - interval '100 days',
           now() - interval '100 days'
    FROM (
        SELECT row_number() OVER () AS n, "NAME", "GENDER", address, "BIRTH_DATE"::date
        FROM (VALUES
            ('Budi Santoso',     'MALE',   'Jl. Kemang Raya No. 12, Jakarta Selatan', '1995-02-10'),
            ('Siti Rahmawati',   'FEMALE', 'Jl. Dago No. 45, Bandung',                '1992-07-21'),
            ('Agus Prasetyo',    'MALE',   'Jl. Pemuda No. 8, Semarang',              '1988-11-03'),
            ('Dewi Lestari',     'FEMALE', 'Jl. Malioboro No. 21, Yogyakarta',        '1990-04-17'),
            ('Rudi Hartono',     'MALE',   'Jl. Basuki Rahmat No. 77, Surabaya',      '1985-09-30'),
            ('Ani Wulandari',    'FEMALE', 'Jl. Gajah Mada No. 5, Medan',             '1997-01-25'),
            ('Eko Wijaya',       'MALE',   'Jl. Slamet Riyadi No. 33, Surakarta',     '1993-06-14'),
            ('Rina Susanti',     'FEMALE', 'Jl. Sudirman No. 102, Pekanbaru',         '1991-12-02'),
            ('Dedi Kurniawan',   'MALE',   'Jl. Ahmad Yani No. 18, Makassar',         '1987-03-09'),
            ('Maya Anggraini',   'FEMALE', 'Jl. Diponegoro No. 64, Denpasar',         '1994-08-28'),
            ('Hendra Gunawan',   'MALE',   'Jl. Veteran No. 9, Malang',               '1989-05-19'),
            ('Lina Marlina',     'FEMALE', 'Jl. Cihampelas No. 150, Bandung',         '1996-10-06'),
            ('Fajar Nugroho',    'MALE',   'Jl. Pandanaran No. 27, Semarang',         '1998-02-23'),
            ('Putri Handayani',  'FEMALE', 'Jl. Margonda Raya No. 88, Depok',         '1999-11-11'),
            ('Yusuf Maulana',    'MALE',   'Jl. Cendrawasih No. 4, Bekasi',           '1986-07-07'),
            ('Nur Aisyah',       'FEMALE', 'Jl. Raya Bogor Km 30, Jakarta Timur',     '1993-03-15'),
            ('Bambang Setiawan', 'MALE',   'Jl. Kaliurang Km 5, Sleman',              '1982-01-31'),
            ('Intan Permata',    'FEMALE', 'Jl. Pahlawan No. 56, Palembang',          '1995-09-09'),
            ('Rizky Ramadhan',   'MALE',   'Jl. Teuku Umar No. 14, Banda Aceh',       '2000-04-04'),
            ('Wulan Sari',       'FEMALE', 'Jl. Imam Bonjol No. 39, Padang',          '1992-06-26'),
            ('Andi Saputra',     'MALE',   'Jl. Panglima Polim No. 3, Jakarta Selatan','1990-12-20'),
            ('Tia Rosdiana',     'FEMALE', 'Jl. Asia Afrika No. 71, Bandung',         '1997-05-05'),
            ('Joko Susilo',      'MALE',   'Jl. Thamrin No. 26, Jakarta Pusat',       '1984-08-12'),
            ('Mega Puspita',     'FEMALE', 'Jl. Gatot Subroto No. 90, Tangerang',     '1991-02-14'),
            ('Dimas Pratama',    'MALE',   'Jl. Jenderal Sudirman No. 6, Balikpapan', '1996-01-08'),
            ('Citra Dewanti',    'FEMALE', 'Jl. Pemuda No. 120, Samarinda',           '1994-10-30'),
            ('Arif Rahman',      'MALE',   'Jl. Ki Hajar Dewantara No. 11, Pontianak','1989-11-22'),
            ('Novi Kartika',     'FEMALE', 'Jl. Merdeka No. 48, Manado',              '1998-07-17'),
            ('Taufik Hidayat',   'MALE',   'Jl. Rajawali No. 35, Lampung',            '1983-04-01'),
            ('Sari Indah',       'FEMALE', 'Jl. Cut Nyak Dien No. 2, Medan',          '1993-09-18')
        ) AS v("NAME", "GENDER", address, "BIRTH_DATE")
    ) c;

    SELECT array_agg("CUSTOMER_ID" ORDER BY "CUSTOMER_NAME") INTO v_cust FROM "CUSTOMERS";
    SELECT array_agg("PRODUCT_ID"  ORDER BY "PRODUCT_ID")    INTO v_prod FROM "PRODUCTS";

    CREATE TEMP TABLE seed_raw ON COMMIT DROP AS
    SELECT g AS n,
           1 + 89 * power(random(), 1.3)                           AS age_days,
           random() AS u, random() AS r_paid, random() AS r_ship,
           random() AS r_done, random() AS r_cancel, random() AS r_cancel_paid,
           v_cust[1 + floor(random() * cardinality(v_cust))::int]  AS "CUSTOMER_ID",
           CASE WHEN random() < 0.7 THEN v_cashier ELSE v_admin END AS "CREATED_BY"
    FROM generate_series(1, 150) g;

    CREATE TEMP TABLE seed_orders ON COMMIT DROP AS
    WITH s1 AS (
        SELECT *,
               now() - age_days * interval '1 day' AS "ORDER_DATE",
               (CASE
                  WHEN age_days < 2 THEN
                      CASE WHEN u < 0.60 THEN 'PENDING' WHEN u < 0.90 THEN 'PAID' ELSE 'CANCELLED' END
                  WHEN age_days < 7 THEN
                      CASE WHEN u < 0.35 THEN 'PENDING' WHEN u < 0.55 THEN 'PAID'
                           WHEN u < 0.85 THEN 'SHIPPED' ELSE 'CANCELLED' END
                  WHEN age_days < 14 THEN
                      CASE WHEN u < 0.20 THEN 'PENDING' WHEN u < 0.30 THEN 'PAID'
                           WHEN u < 0.50 THEN 'SHIPPED' WHEN u < 0.90 THEN 'COMPLETED' ELSE 'CANCELLED' END
                  ELSE
                      CASE WHEN u < 0.03 THEN 'PAID' WHEN u < 0.08 THEN 'SHIPPED'
                           WHEN u < 0.88 THEN 'COMPLETED' ELSE 'CANCELLED' END
                END)::order_status AS "STATUS"
        FROM seed_raw
    ), s2 AS (
        SELECT *,
               CASE WHEN "STATUS" IN ('PAID', 'SHIPPED', 'COMPLETED')
                      OR ("STATUS" = 'CANCELLED' AND r_cancel_paid < 0.5)
                    THEN "ORDER_DATE" + (5 + r_paid * 175) * interval '1 minute' END AS "PAID_AT"
        FROM s1
    ), s3 AS (
        SELECT *,
               CASE WHEN "STATUS" IN ('SHIPPED', 'COMPLETED')
                    THEN "PAID_AT" + (2 + r_ship * 22) * interval '1 hour' END AS "SHIPPED_AT"
        FROM s2
    )
    SELECT n, "CUSTOMER_ID", "CREATED_BY", "ORDER_DATE", "STATUS", "PAID_AT", "SHIPPED_AT",
           CASE WHEN "STATUS" = 'COMPLETED'
                THEN "SHIPPED_AT" + (1 + r_done * 4) * interval '1 day' END AS "COMPLETED_AT",
           CASE WHEN "STATUS" = 'CANCELLED'
                THEN COALESCE("PAID_AT", "ORDER_DATE") + (10 + r_cancel * 590) * interval '1 minute' END AS "CANCELLED_AT",
           CASE WHEN "STATUS" = 'CANCELLED'
                THEN (ARRAY['Customer membatalkan pesanan',
                            'Pembayaran tidak diterima',
                            'Alamat pengiriman tidak valid',
                            'Customer salah memilih produk'])[1 + floor(r_cancel * 4)::int] END AS "CANCEL_REASON"
    FROM s3;

    CREATE TEMP TABLE seed_items (
        n int, "PRODUCT_ID" bigint, "QUANTITY" int, "UNIT_PRICE" numeric(12,2)
    ) ON COMMIT DROP;

    FOR r IN SELECT n FROM seed_orders ORDER BY n LOOP
        INSERT INTO seed_items (n, "PRODUCT_ID", "QUANTITY", "UNIT_PRICE")
        SELECT r.n, p."PRODUCT_ID", 1 + floor(random() * 5)::int, p."PRICE"
        FROM "PRODUCTS" p
        ORDER BY random()
        LIMIT 1 + floor(random() * 4)::int;
    END LOOP;

    FOR r IN SELECT * FROM seed_orders ORDER BY "ORDER_DATE", n LOOP
        INSERT INTO "ORDERS" ("CUSTOMER_ID", "CREATED_BY", "STATUS", "TOTAL_AMOUNT", "ORDER_DATE",
                            "PAID_AT", "SHIPPED_AT", "COMPLETED_AT", "CANCELLED_AT", "CANCEL_REASON",
                            "CREATED_AT", "UPDATED_AT")
        VALUES (r."CUSTOMER_ID", r."CREATED_BY", r."STATUS",
                (SELECT SUM("QUANTITY" * "UNIT_PRICE") FROM seed_items WHERE n = r.n),
                r."ORDER_DATE", r."PAID_AT", r."SHIPPED_AT", r."COMPLETED_AT", r."CANCELLED_AT", r."CANCEL_REASON",
                r."ORDER_DATE",
                COALESCE(r."CANCELLED_AT", r."COMPLETED_AT", r."SHIPPED_AT", r."PAID_AT", r."ORDER_DATE"))
        RETURNING "ORDER_ID" INTO v_order_id;

        INSERT INTO "ORDER_ITEMS" ("ORDER_ID", "PRODUCT_ID", "QUANTITY", "UNIT_PRICE", "SUBTOTAL")
        SELECT v_order_id, "PRODUCT_ID", "QUANTITY", "UNIT_PRICE", "QUANTITY" * "UNIT_PRICE"
        FROM seed_items WHERE n = r.n;

        INSERT INTO "ORDER_STATUS_HISTORY" ("ORDER_ID", "FROM_STATUS", "TO_STATUS", "REASON", "CREATED_BY", "CREATED_AT")
        VALUES (v_order_id, NULL, 'PENDING', NULL, r."CREATED_BY", r."ORDER_DATE");

        IF r."PAID_AT" IS NOT NULL THEN
            INSERT INTO "ORDER_STATUS_HISTORY" ("ORDER_ID", "FROM_STATUS", "TO_STATUS", "CREATED_BY", "CREATED_AT")
            VALUES (v_order_id, 'PENDING', 'PAID', r."CREATED_BY", r."PAID_AT");
        END IF;
        IF r."SHIPPED_AT" IS NOT NULL THEN
            INSERT INTO "ORDER_STATUS_HISTORY" ("ORDER_ID", "FROM_STATUS", "TO_STATUS", "CREATED_BY", "CREATED_AT")
            VALUES (v_order_id, 'PAID', 'SHIPPED', v_admin, r."SHIPPED_AT");
        END IF;
        IF r."COMPLETED_AT" IS NOT NULL THEN
            INSERT INTO "ORDER_STATUS_HISTORY" ("ORDER_ID", "FROM_STATUS", "TO_STATUS", "CREATED_BY", "CREATED_AT")
            VALUES (v_order_id, 'SHIPPED', 'COMPLETED', v_admin, r."COMPLETED_AT");
        END IF;
        IF r."CANCELLED_AT" IS NOT NULL THEN
            INSERT INTO "ORDER_STATUS_HISTORY" ("ORDER_ID", "FROM_STATUS", "TO_STATUS", "REASON", "CREATED_BY", "CREATED_AT")
            VALUES (v_order_id,
                    CASE WHEN r."PAID_AT" IS NOT NULL THEN 'PAID'::order_status ELSE 'PENDING'::order_status END,
                    'CANCELLED', r."CANCEL_REASON", v_admin, r."CANCELLED_AT");
        END IF;
    END LOOP;

    CREATE TEMP TABLE seed_mv (
        seq bigserial, "PRODUCT_ID" bigint, "TYPE" stock_movement_type, "QUANTITY_CHANGE" int,
        "REFERENCE_TYPE" varchar(50), "REFERENCE_ID" varchar(100), "NOTE" varchar(1000),
        "CREATED_BY" uuid, "CREATED_AT" timestamptz
    ) ON COMMIT DROP;

    INSERT INTO seed_mv ("PRODUCT_ID", "TYPE", "QUANTITY_CHANGE", "REFERENCE_TYPE", "REFERENCE_ID", "CREATED_BY", "CREATED_AT")
    SELECT oi."PRODUCT_ID", 'ORDER_OUT', -oi."QUANTITY", 'order', o."ORDER_ID"::text, o."CREATED_BY", o."ORDER_DATE"
    FROM "ORDER_ITEMS" oi JOIN "ORDERS" o ON o."ORDER_ID" = oi."ORDER_ID"
    ORDER BY o."ORDER_DATE", o."ORDER_ID", oi."PRODUCT_ID";

    INSERT INTO seed_mv ("PRODUCT_ID", "TYPE", "QUANTITY_CHANGE", "REFERENCE_TYPE", "REFERENCE_ID", "CREATED_BY", "CREATED_AT")
    SELECT oi."PRODUCT_ID", 'CANCEL_RESTORE', oi."QUANTITY", 'order', o."ORDER_ID"::text, v_admin, o."CANCELLED_AT"
    FROM "ORDER_ITEMS" oi JOIN "ORDERS" o ON o."ORDER_ID" = oi."ORDER_ID"
    WHERE o."STATUS" = 'CANCELLED'
    ORDER BY o."CANCELLED_AT", o."ORDER_ID", oi."PRODUCT_ID";

    INSERT INTO seed_mv ("PRODUCT_ID", "TYPE", "QUANTITY_CHANGE", "NOTE", "CREATED_BY", "CREATED_AT")
    SELECT v_prod[1 + floor(random() * cardinality(v_prod))::int],
           'ADJUSTMENT',
           CASE WHEN g <= 8 THEN 20 + floor(random() * 41)::int ELSE -(1 + floor(random() * 3)::int) END,
           CASE WHEN g <= 8 THEN 'Restock dari supplier'
                ELSE 'Stock opname: barang rusak / kadaluarsa' END,
           v_admin,
           now() - (3 + random() * 80) * interval '1 day'
    FROM generate_series(1, 12) g;

    INSERT INTO seed_mv ("PRODUCT_ID", "TYPE", "QUANTITY_CHANGE", "NOTE", "CREATED_BY", "CREATED_AT")
    SELECT p."PRODUCT_ID",
           'INITIAL',
           COALESCE(-SUM(m."QUANTITY_CHANGE") FILTER (WHERE m."TYPE" = 'ORDER_OUT'), 0)
             + COALESCE(-SUM(m."QUANTITY_CHANGE") FILTER (WHERE m."TYPE" = 'ADJUSTMENT' AND m."QUANTITY_CHANGE" < 0), 0)
             + 20 + floor(random() * 80)::int,
           'Stok awal',
           v_admin,
           now() - interval '91 days'
    FROM "PRODUCTS" p
    LEFT JOIN seed_mv m ON m."PRODUCT_ID" = p."PRODUCT_ID"
    GROUP BY p."PRODUCT_ID";

    INSERT INTO seed_mv ("PRODUCT_ID", "TYPE", "QUANTITY_CHANGE", "NOTE", "CREATED_BY", "CREATED_AT")
    SELECT p."PRODUCT_ID", 'ADJUSTMENT', (p."PRODUCT_ID" % 4) - cur.total, 'Stock opname bulanan: hasil hitung fisik',
           v_admin, now() - interval '1 hour'
    FROM "PRODUCTS" p
    JOIN (SELECT "PRODUCT_ID", SUM("QUANTITY_CHANGE")::int AS total FROM seed_mv GROUP BY "PRODUCT_ID") cur
      ON cur."PRODUCT_ID" = p."PRODUCT_ID"
    WHERE p."PRODUCT_ID" % 7 = 0
      AND (p."PRODUCT_ID" % 4) - cur.total <> 0;

    INSERT INTO "STOCK_MOVEMENTS" ("PRODUCT_ID", "TYPE", "QUANTITY_CHANGE", "STOCK_AFTER",
                                 "REFERENCE_TYPE", "REFERENCE_ID", "NOTE", "CREATED_BY", "CREATED_AT")
    SELECT "PRODUCT_ID", "TYPE", "QUANTITY_CHANGE",
           SUM("QUANTITY_CHANGE") OVER (PARTITION BY "PRODUCT_ID" ORDER BY "CREATED_AT", seq)::int,
           "REFERENCE_TYPE", "REFERENCE_ID", "NOTE", "CREATED_BY", "CREATED_AT"
    FROM seed_mv
    ORDER BY "CREATED_AT", seq;

    UPDATE "PRODUCTS" p
    SET "STOCK" = s.total, "UPDATED_AT" = now()
    FROM (SELECT "PRODUCT_ID", SUM("QUANTITY_CHANGE")::int AS total
          FROM "STOCK_MOVEMENTS" GROUP BY "PRODUCT_ID") s
    WHERE s."PRODUCT_ID" = p."PRODUCT_ID";

    INSERT INTO "AUDIT_LOGS" ("REQUEST_ID", "USER_ID", "ACTION", "ENTITY_TYPE", "ENTITY_ID",
                            "BEFORE_DATA", "AFTER_DATA", "METADATA", "CREATED_AT")
    SELECT a.req, a.uid, a.act, a.etype, a.eid, a.bef, a.aft,
           jsonb_build_object('changed_fields', a.chg, 'source', 'seed'),
           a.at
    FROM (
        SELECT 'seed-bootstrap'::text AS req, NULL::uuid AS uid, 'INSERT'::text AS act,
               'USERS'::text AS etype, u."USER_ID"::text AS eid,
               NULL::jsonb AS bef, (to_jsonb(u) - 'PASSWORD') AS aft, '[]'::jsonb AS chg,
               u."CREATED_AT" AS at, 1 AS ord, 0::bigint AS k
        FROM "USERS" u

        UNION ALL
        SELECT 'seed-bootstrap', NULL, 'INSERT', 'PRODUCTS', p."PRODUCT_ID"::text,
               NULL, to_jsonb(p) || jsonb_build_object('STOCK', 0, 'UPDATED_AT', p."CREATED_AT"),
               '[]'::jsonb, p."CREATED_AT", 2, p."PRODUCT_ID"
        FROM "PRODUCTS" p

        UNION ALL
        SELECT 'seed-bootstrap', NULL, 'INSERT', 'CUSTOMERS', c."CUSTOMER_ID"::text,
               NULL, to_jsonb(c), '[]'::jsonb, c."CREATED_AT", 3, 0
        FROM "CUSTOMERS" c

        UNION ALL
        SELECT 'seed-order-' || o."ORDER_ID", h."CREATED_BY",
               CASE WHEN h."FROM_STATUS" IS NULL THEN 'INSERT' ELSE 'UPDATE' END,
               'ORDERS', o."ORDER_ID"::text,
               CASE WHEN h."FROM_STATUS" IS NULL THEN NULL
                    ELSE jsonb_build_object('STATUS', h."FROM_STATUS") END,
               CASE WHEN h."FROM_STATUS" IS NULL
                    THEN jsonb_build_object('ORDER_ID',     o."ORDER_ID",
                                            'ORDER_NUMBER', o."ORDER_NUMBER",
                                            'CUSTOMER_ID',  o."CUSTOMER_ID",
                                            'CREATED_BY',   o."CREATED_BY",
                                            'STATUS',       h."TO_STATUS",
                                            'TOTAL_AMOUNT', o."TOTAL_AMOUNT")
                    ELSE jsonb_build_object('STATUS', h."TO_STATUS")
                         || CASE WHEN h."REASON" IS NOT NULL
                                 THEN jsonb_build_object('CANCEL_REASON', h."REASON")
                                 ELSE '{}'::jsonb END
               END,
               CASE WHEN h."FROM_STATUS" IS NULL THEN '[]'::jsonb ELSE '["STATUS"]'::jsonb END,
               h."CREATED_AT", 4, h."ORDER_STATUS_HISTORY_ID"
        FROM "ORDER_STATUS_HISTORY" h
        JOIN "ORDERS" o ON o."ORDER_ID" = h."ORDER_ID"

        UNION ALL
        SELECT 'seed-order-' || oi."ORDER_ID", o."CREATED_BY", 'INSERT', 'ORDER_ITEMS',
               oi."ORDER_ITEM_ID"::text, NULL, to_jsonb(oi), '[]'::jsonb,
               o."ORDER_DATE", 5, oi."ORDER_ITEM_ID"
        FROM "ORDER_ITEMS" oi
        JOIN "ORDERS" o ON o."ORDER_ID" = oi."ORDER_ID"

        UNION ALL
        SELECT CASE WHEN sm."REFERENCE_TYPE" = 'order'
                    THEN 'seed-order-' || sm."REFERENCE_ID"
                    ELSE 'seed-stock-' || sm."STOCK_MOVEMENT_ID" END,
               sm."CREATED_BY", 'UPDATE', 'PRODUCTS', sm."PRODUCT_ID"::text,
               jsonb_build_object('STOCK', sm."STOCK_AFTER" - sm."QUANTITY_CHANGE"),
               jsonb_build_object('STOCK', sm."STOCK_AFTER"),
               '["STOCK"]'::jsonb, sm."CREATED_AT", 6, sm."STOCK_MOVEMENT_ID"
        FROM "STOCK_MOVEMENTS" sm
    ) a
    ORDER BY a.at, a.ord, a.k;

    FOR tg IN SELECT * FROM seed_audit_triggers LOOP
        EXECUTE format('ALTER TABLE %I ENABLE TRIGGER %I', tg.tbl, tg.trg);
    END LOOP;

    SELECT count(*) INTO n_users     FROM "USERS";
    SELECT count(*) INTO n_products  FROM "PRODUCTS";
    SELECT count(*) INTO n_customers FROM "CUSTOMERS";
    SELECT count(*) INTO n_orders    FROM "ORDERS";
    SELECT count(*) INTO n_audit     FROM "AUDIT_LOGS";

    IF n_users <> 2 OR n_products < 50 OR n_customers < 30 OR n_orders < 150 THEN
        RAISE EXCEPTION 'Seed row counts are wrong: users=%, products=%, customers=%, orders=%',
            n_users, n_products, n_customers, n_orders;
    END IF;

    IF (SELECT count(DISTINCT "STATUS") FROM "ORDERS") < 5 THEN
        RAISE EXCEPTION 'Seed must contain all 5 order statuses';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "ORDERS" o
        WHERE o."TOTAL_AMOUNT" <> (SELECT SUM("SUBTOTAL") FROM "ORDER_ITEMS" WHERE "ORDER_ID" = o."ORDER_ID")
    ) THEN
        RAISE EXCEPTION 'orders.total_amount does not equal sum(order_items.subtotal)';
    END IF;

    IF EXISTS (
        SELECT 1 FROM "PRODUCTS" p
        WHERE p."STOCK" <> (SELECT "STOCK_AFTER" FROM "STOCK_MOVEMENTS"
                          WHERE "PRODUCT_ID" = p."PRODUCT_ID" ORDER BY "CREATED_AT" DESC, "STOCK_MOVEMENT_ID" DESC LIMIT 1)
    ) THEN
        RAISE EXCEPTION 'products.stock does not match the last ledger row';
    END IF;

    IF n_audit <> n_users + n_products + n_customers
                  + (SELECT count(*) FROM "ORDER_STATUS_HISTORY")
                  + (SELECT count(*) FROM "ORDER_ITEMS")
                  + (SELECT count(*) FROM "STOCK_MOVEMENTS") THEN
        RAISE EXCEPTION 'AUDIT_LOGS has % rows, expected % (backfill count mismatch)',
            n_audit,
            n_users + n_products + n_customers
              + (SELECT count(*) FROM "ORDER_STATUS_HISTORY")
              + (SELECT count(*) FROM "ORDER_ITEMS")
              + (SELECT count(*) FROM "STOCK_MOVEMENTS");
    END IF;

    RAISE NOTICE 'Seed OK: % users, % products, % customers, % orders, % audit rows',
        n_users, n_products, n_customers, n_orders, n_audit;
END
$seed$;

SELECT "STATUS", count(*) AS "ORDERS", min("ORDER_DATE")::date AS oldest, max("ORDER_DATE")::date AS newest
FROM "ORDERS" GROUP BY "STATUS" ORDER BY "STATUS";

SELECT count(*) AS low_stock_products
FROM "PRODUCTS" WHERE "STOCK" < "LOW_STOCK_THRESHOLD" AND "DELETED_AT" IS NULL;

SELECT "ENTITY_TYPE", "ACTION", count(*) AS audit_rows
FROM "AUDIT_LOGS" GROUP BY "ENTITY_TYPE", "ACTION" ORDER BY "ENTITY_TYPE", "ACTION";

SELECT c.relname AS "TABLE", t.tgname AS "TRIGGER", t.tgenabled AS enabled
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE t.tgfoid = to_regproc('audit_row_change') AND NOT t.tgisinternal
ORDER BY c.relname;