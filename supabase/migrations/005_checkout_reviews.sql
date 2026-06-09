-- Checkout fields on orders + customer reviews

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id BIGINT NOT NULL REFERENCES shops(id) ON DELETE CASCADE, -- Changed from UUID to BIGINT
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON reviews (shop_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_user
  ON reviews (order_id, user_id)
  WHERE order_id IS NOT NULL;