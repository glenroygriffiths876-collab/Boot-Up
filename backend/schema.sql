-- Cloudflare D1: private order records. Run via wrangler d1 migrations apply or execute.
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 customer_name TEXT NOT NULL,
 customer_phone TEXT NOT NULL,
 pickup_date TEXT NOT NULL,
 pickup_time TEXT,
 payment_method TEXT NOT NULL CHECK(payment_method IN ('bank','cash')),
 transfer_reference TEXT,
 reference_key TEXT,
 total_jmd INTEGER NOT NULL CHECK(total_jmd >= 0),
 items_json TEXT NOT NULL,
 allergy TEXT NOT NULL,
 allergy_details TEXT,
 notes TEXT,
 payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','verified','rejected','cash_due')),
 order_status TEXT NOT NULL DEFAULT 'requested' CHECK(order_status IN ('requested','accepted','preparing','completed','cancelled')),
 flagged_duplicate INTEGER NOT NULL DEFAULT 0,
 verified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference_key);
CREATE TABLE IF NOT EXISTS rate_limits (
 key TEXT PRIMARY KEY,
 window_start INTEGER NOT NULL,
 hits INTEGER NOT NULL
);
