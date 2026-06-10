-- Live order tracking: driver (delivery) or customer (pickup)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracked_by TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracker_lat NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracker_lng NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracker_updated_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_consent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders (tracking_enabled) WHERE tracking_enabled = TRUE;
