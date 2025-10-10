-- Remove financial calculation fields and add remarks field
-- This migration simplifies the application form to only capture essential customer information

-- Add remarks column
ALTER TABLE applications
ADD COLUMN remarks TEXT;

-- Drop financial calculation columns
ALTER TABLE applications
DROP COLUMN IF EXISTS amount_limit,
DROP COLUMN IF EXISTS profit_margin,
DROP COLUMN IF EXISTS tenure_months,
DROP COLUMN IF EXISTS monthly_installment;

-- Add comment
COMMENT ON COLUMN applications.remarks IS 'Optional remarks or notes about the application';
