-- Zamzam Bank Financing Portal - Core Database Schema
-- This script creates the foundational tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROLES & PERMISSIONS
-- ============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('branch_user', 'head_office_approver', 'system_admin');

-- Application status enum
CREATE TYPE application_status AS ENUM ('pending', 'in_review', 'approved', 'rejected', 'returned');

-- ============================================
-- ORGANIZATIONAL STRUCTURE
-- ============================================

-- Districts table
CREATE TABLE districts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Branches table
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    district_id UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, district_id)
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    product_code VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER MANAGEMENT
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approver assignments (RBAC configuration)
CREATE TABLE approver_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    district_id UUID REFERENCES districts(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    -- At least one assignment criteria must be specified
    CONSTRAINT at_least_one_criteria CHECK (
        district_id IS NOT NULL OR 
        branch_id IS NOT NULL OR 
        product_id IS NOT NULL
    )
);

-- Index for faster approver assignment lookups
CREATE INDEX idx_approver_assignments_approver ON approver_assignments(approver_id);
CREATE INDEX idx_approver_assignments_district ON approver_assignments(district_id);
CREATE INDEX idx_approver_assignments_branch ON approver_assignments(branch_id);
CREATE INDEX idx_approver_assignments_product ON approver_assignments(product_id);

-- ============================================
-- APPLICATIONS
-- ============================================

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_id VARCHAR(100),
    phone_number VARCHAR(50) NOT NULL,
    
    -- Product and branch
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    
    -- Renamed to Sharia-compliant terminology
    -- Financial details
    amount_limit DECIMAL(15, 2) NOT NULL,
    profit_margin DECIMAL(5, 2),
    tenure_months INTEGER,
    monthly_installment DECIMAL(15, 2),
    
    -- Status and workflow
    status application_status NOT NULL DEFAULT 'pending',
    current_approver_id UUID REFERENCES users(id),
    
    -- Submission details
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_branch ON applications(branch_id);
CREATE INDEX idx_applications_product ON applications(product_id);
CREATE INDEX idx_applications_submitted_by ON applications(submitted_by);
CREATE INDEX idx_applications_current_approver ON applications(current_approver_id);
CREATE INDEX idx_applications_number ON applications(application_number);

-- ============================================
-- AUDIT TRAIL & HISTORY
-- ============================================

-- Application status history (immutable audit trail)
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status application_status,
    to_status application_status NOT NULL,
    action_by UUID NOT NULL REFERENCES users(id),
    action_by_role user_role NOT NULL,
    reason TEXT, -- Mandatory for 'returned' and 'rejected' statuses
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit trail queries
CREATE INDEX idx_status_history_application ON application_status_history(application_id);
CREATE INDEX idx_status_history_created ON application_status_history(created_at DESC);

-- Audit log for all system actions (immutable)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'application_submitted', 'status_changed', 'returned', etc.
    related_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for notification queries
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_districts_updated_at BEFORE UPDATE ON districts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate application number
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.application_number := 'APP-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('application_number_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sequence for application numbers
CREATE SEQUENCE application_number_seq START 1;

-- Trigger to auto-generate application number
CREATE TRIGGER generate_app_number BEFORE INSERT ON applications
    FOR EACH ROW EXECUTE FUNCTION generate_application_number();
