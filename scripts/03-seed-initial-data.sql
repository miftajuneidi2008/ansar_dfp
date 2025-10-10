-- Zamzam Bank Financing Portal - Initial Seed Data
-- This script populates the database with initial data

-- ============================================
-- SEED PRODUCTS
-- ============================================

INSERT INTO products (name, description, product_code, is_active) VALUES
('Salihat', 'Salihat financing product for personal needs', 'SALIHAT', true),
('Small Enterprise Working Capital', 'Working capital financing for small enterprises', 'SEWC', true),
('Medium Enterprise Capital Expenditure', 'Capital expenditure financing for medium enterprises', 'MECE', true),
('Commercial', 'Commercial financing solutions', 'COMMERCIAL', true);

-- ============================================
-- SEED DISTRICTS (Sample data - adjust as needed)
-- ============================================

INSERT INTO districts (name, code) VALUES
('Addis Ababa', 'AA'),
('Adama', 'AD'),
('Bahir Dar', 'BD'),
('Hawassa', 'HW'),
('Mekelle', 'MK'),
('Dire Dawa', 'DD');

-- ============================================
-- SEED BRANCHES (Sample data - adjust as needed)
-- ============================================

-- Get district IDs for reference
DO $$
DECLARE
    district_aa UUID;
    district_ad UUID;
    district_bd UUID;
    district_hw UUID;
    district_mk UUID;
    district_dd UUID;
BEGIN
    SELECT id INTO district_aa FROM districts WHERE code = 'AA';
    SELECT id INTO district_ad FROM districts WHERE code = 'AD';
    SELECT id INTO district_bd FROM districts WHERE code = 'BD';
    SELECT id INTO district_hw FROM districts WHERE code = 'HW';
    SELECT id INTO district_mk FROM districts WHERE code = 'MK';
    SELECT id INTO district_dd FROM districts WHERE code = 'DD';

    -- Addis Ababa branches
    INSERT INTO branches (name, code, district_id, is_active) VALUES
    ('Bole Branch', '001', district_aa, true),
    ('Piassa Branch', '002', district_aa, true),
    ('Saris Branch', '003', district_aa, true),
    ('CMC Branch', '004', district_aa, true),
    ('Merkato Branch', '005', district_aa, true);

    -- Adama branches
    INSERT INTO branches (name, code, district_id, is_active) VALUES
    ('Adama Main Branch', '101', district_ad, true),
    ('Adama East Branch', '102', district_ad, true);

    -- Bahir Dar branches
    INSERT INTO branches (name, code, district_id, is_active) VALUES
    ('Bahir Dar Main Branch', '201', district_bd, true),
    ('Bahir Dar Tana Branch', '202', district_bd, true);

    -- Hawassa branches
    INSERT INTO branches (name, code, district_id, is_active) VALUES
    ('Hawassa Main Branch', '301', district_hw, true);

    -- Mekelle branches
    INSERT INTO branches (name, code, district_id, is_active) VALUES
    ('Mekelle Main Branch', '401', district_mk, true);

    -- Dire Dawa branches
    INSERT INTO branches (name, code, district_id, is_active) VALUES
    ('Dire Dawa Main Branch', '501', district_dd, true);
END $$;

-- Note: User accounts will be created through the application's signup/admin interface
-- and linked to Supabase auth.users
