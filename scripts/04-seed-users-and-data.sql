-- =====================================================
-- Seed Users and Additional Data
-- =====================================================
-- NOTE: Users must first create auth accounts via Supabase UI or the application
-- Then run this script to create their profiles

-- Add more districts first
INSERT INTO public.districts (name, code) VALUES
('Oromia Region', 'ORM'),
('Amhara Region', 'AMH'),
('Tigray Region', 'TGR'),
('Southern Region', 'STH')
ON CONFLICT (name) DO NOTHING;

-- Add more branches across different districts
INSERT INTO public.branches (name, code, district_id) VALUES
-- Addis Ababa branches
('Bole Branch', 'BLE-001', (SELECT id FROM public.districts WHERE name = 'Addis Ababa' LIMIT 1)),
('Merkato Branch', 'MRK-001', (SELECT id FROM public.districts WHERE name = 'Addis Ababa' LIMIT 1)),
('CMC Branch', 'CMC-001', (SELECT id FROM public.districts WHERE name = 'Addis Ababa' LIMIT 1)),
('Megenagna Branch', 'MGN-001', (SELECT id FROM public.districts WHERE name = 'Addis Ababa' LIMIT 1)),

-- Oromia branches
('Adama Branch', 'ADM-001', (SELECT id FROM public.districts WHERE name = 'Oromia Region' LIMIT 1)),
('Bishoftu Branch', 'BSH-001', (SELECT id FROM public.districts WHERE name = 'Oromia Region' LIMIT 1)),
('Jimma Branch', 'JMM-001', (SELECT id FROM public.districts WHERE name = 'Oromia Region' LIMIT 1)),

-- Amhara branches
('Bahir Dar Branch', 'BHR-001', (SELECT id FROM public.districts WHERE name = 'Amhara Region' LIMIT 1)),
('Gondar Branch', 'GND-001', (SELECT id FROM public.districts WHERE name = 'Amhara Region' LIMIT 1)),
('Dessie Branch', 'DSS-001', (SELECT id FROM public.districts WHERE name = 'Amhara Region' LIMIT 1)),

-- Tigray branches
('Mekelle Branch', 'MKL-001', (SELECT id FROM public.districts WHERE name = 'Tigray Region' LIMIT 1)),

-- Southern Region branches
('Hawassa Branch', 'HWS-001', (SELECT id FROM public.districts WHERE name = 'Southern Region' LIMIT 1)),
('Arba Minch Branch', 'ARM-001', (SELECT id FROM public.districts WHERE name = 'Southern Region' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- IMPORTANT: Create these user accounts first via the UI
-- =====================================================
-- After creating auth accounts, their profiles will be automatically created
-- via the application's sign-up flow or you can manually insert them here
-- if you have their auth.users IDs

-- Example: If you've created the auth accounts and have their IDs, you can insert:
-- INSERT INTO public.users (id, email, full_name, role, branch_id, is_active) VALUES
-- ('auth-user-id-here', 'hawa.s@zamzambank.com', 'Hawa Said', 'head_office_approver', NULL, true);

-- For now, we'll create placeholder data that can be linked later

-- =====================================================
-- Sample Applications (using existing users if any)
-- =====================================================
-- This section will only work if you have users created
-- Comment out if no users exist yet

-- Check if we have any branch users to create sample applications
DO $$
DECLARE
    branch_user_count INTEGER;
    sample_user_id UUID;
    main_branch_id UUID;
    piassa_branch_id UUID;
    salihat_product_id UUID;
    small_enterprise_id UUID;
    medium_enterprise_id UUID;
BEGIN
    -- Count existing branch users
    SELECT COUNT(*) INTO branch_user_count FROM public.users WHERE role = 'branch_user';
    
    IF branch_user_count > 0 THEN
        -- Get IDs we'll need
        SELECT id INTO main_branch_id FROM public.branches WHERE name = 'Main Branch' LIMIT 1;
        SELECT id INTO piassa_branch_id FROM public.branches WHERE name = 'Piassa Branch' LIMIT 1;
        SELECT id INTO salihat_product_id FROM public.products WHERE name = 'Salihat' LIMIT 1;
        SELECT id INTO small_enterprise_id FROM public.products WHERE name = 'Small Enterprise Working Capital' LIMIT 1;
        SELECT id INTO medium_enterprise_id FROM public.products WHERE name = 'Medium Enterprise Capital Expenditure' LIMIT 1;
        
        -- Get first branch user
        SELECT id INTO sample_user_id FROM public.users WHERE role = 'branch_user' LIMIT 1;
        
        -- Create sample applications
        INSERT INTO public.applications (
            customer_name,
            customer_id,
            phone_number,
            product_id,
            branch_id,
            submitted_by,
            application_amount,
            interest_rate,
            tenure_months,
            monthly_installment,
            status
        ) VALUES
        ('Ahmed Hassan', 'CUST-000001', '+251911234567', salihat_product_id, main_branch_id, sample_user_id, 50000, 5.0, 36, 1500, 'pending'),
        ('Fatima Ali', 'CUST-000002', '+251922345678', salihat_product_id, main_branch_id, sample_user_id, 75000, 5.0, 36, 2250, 'pending'),
        ('Mohammed Yusuf', 'CUST-000003', '+251933456789', salihat_product_id, main_branch_id, sample_user_id, 100000, 5.0, 36, 3000, 'pending');
        
        -- Create audit trail entries
        INSERT INTO public.application_status_history (
            application_id,
            from_status,
            to_status,
            action_by,
            action_by_role,
            comments
        )
        SELECT
            a.id,
            NULL,
            'pending',
            a.submitted_by,
            'branch_user',
            'Application submitted'
        FROM public.applications a
        WHERE a.customer_name IN ('Ahmed Hassan', 'Fatima Ali', 'Mohammed Yusuf');
        
        RAISE NOTICE 'Created 3 sample applications';
    ELSE
        RAISE NOTICE 'No branch users found. Skipping sample application creation.';
        RAISE NOTICE 'Create user accounts first, then run this script again.';
    END IF;
END $$;

-- =====================================================
-- Instructions for completing setup
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SETUP INSTRUCTIONS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Step 1: Create authentication accounts via the application UI for:';
    RAISE NOTICE '  Approvers:';
    RAISE NOTICE '    - hawa.s@zamzambank.com (Hawa Said)';
    RAISE NOTICE '    - muktar.a@zamzambank.com (Muktar Ahmed)';
    RAISE NOTICE '  Branch Users:';
    RAISE NOTICE '    - mifta.j@zamzambank.com (Mifta Jibril)';
    RAISE NOTICE '    - zemzem.m@zamzambank.com (Zemzem Mohammed)';
    RAISE NOTICE '';
    RAISE NOTICE 'Step 2: After creating accounts, assign roles via User Management:';
    RAISE NOTICE '    - Set Hawa and Muktar as Head Office Approvers';
    RAISE NOTICE '    - Set Mifta and Zemzem as Branch Users';
    RAISE NOTICE '    - Assign Mifta to Main Branch';
    RAISE NOTICE '    - Assign Zemzem to Piassa Branch';
    RAISE NOTICE '';
    RAISE NOTICE 'Step 3: Configure approver assignments via Settings:';
    RAISE NOTICE '    - Hawa: Addis Ababa district, all products';
    RAISE NOTICE '    - Muktar: Oromia and Amhara regions, enterprise products';
    RAISE NOTICE '';
    RAISE NOTICE 'Additional data created:';
    RAISE NOTICE '  - 4 new districts (Oromia, Amhara, Tigray, Southern)';
    RAISE NOTICE '  - 13 new branches across Ethiopia';
    RAISE NOTICE '';
END $$;
