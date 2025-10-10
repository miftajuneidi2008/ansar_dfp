-- Migration script to rename columns to Sharia-compliant terminology
-- Run this after the initial setup to update existing data

-- Rename interest_rate to profit_margin
ALTER TABLE applications 
RENAME COLUMN interest_rate TO profit_margin;

-- Rename application_amount to amount_limit
ALTER TABLE applications 
RENAME COLUMN application_amount TO amount_limit;

-- Add comment to clarify the change
COMMENT ON COLUMN applications.profit_margin IS 'Profit margin percentage (Sharia-compliant term for return rate)';
COMMENT ON COLUMN applications.amount_limit IS 'Financing amount limit requested by the applicant';
