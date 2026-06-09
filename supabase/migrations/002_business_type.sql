-- Business type for seller shops: product-based or service-based
ALTER TABLE shops ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'product';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_setup_complete BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_shops_user_id ON shops (user_id);
