-- Seller verification columns for LGU business permit + valid ID requirements
-- Run this in the Supabase SQL editor before using the new registration flow.

ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS permit_number TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS lgu_municipality TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS permit_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS permit_business_name TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS lgu_verified_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS id_document_data TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS id_document_name TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Existing shops without a status remain visible on the map (null or 'approved').
-- New registrations start as 'pending' until admin approves.

CREATE INDEX IF NOT EXISTS idx_shops_verification_status ON shops (verification_status);
