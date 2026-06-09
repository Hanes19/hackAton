-- Rich listing editor: photos, industry/subcategory, flexible details JSON
ALTER TABLE products ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'product';
ALTER TABLE products ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS highlights TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_name TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_listing_type ON products (listing_type);
CREATE INDEX IF NOT EXISTS idx_products_industry ON products (industry);
