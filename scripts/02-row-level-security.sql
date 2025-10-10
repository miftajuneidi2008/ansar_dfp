-- Zamzam Bank Financing Portal - Row Level Security Policies
-- This script implements strict RBAC and data segregation

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE approver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Get current user's branch
CREATE OR REPLACE FUNCTION get_user_branch()
RETURNS UUID AS $$
    SELECT branch_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is system admin
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'system_admin'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user is approver
CREATE OR REPLACE FUNCTION is_approver()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'head_office_approver'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if approver can access application based on assignments
CREATE OR REPLACE FUNCTION can_approver_access_application(app_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN approver_assignments aa ON aa.approver_id = auth.uid()
        WHERE a.id = app_id
        AND (
            -- Match by district
            (aa.district_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM branches b 
                WHERE b.id = a.branch_id AND b.district_id = aa.district_id
            ))
            OR
            -- Match by branch
            (aa.branch_id IS NOT NULL AND a.branch_id = aa.branch_id)
            OR
            -- Match by product
            (aa.product_id IS NOT NULL AND a.product_id = aa.product_id)
        )
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- System admins can see all users
CREATE POLICY "System admins can view all users"
    ON users FOR SELECT
    USING (is_system_admin());

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- System admins can manage users
CREATE POLICY "System admins can insert users"
    ON users FOR INSERT
    WITH CHECK (is_system_admin());

CREATE POLICY "System admins can update users"
    ON users FOR UPDATE
    USING (is_system_admin());

-- ============================================
-- ORGANIZATIONAL STRUCTURE POLICIES
-- ============================================

-- Everyone can view districts, branches, and products
CREATE POLICY "Authenticated users can view districts"
    ON districts FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view branches"
    ON branches FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view products"
    ON products FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only system admins can manage organizational structure
CREATE POLICY "System admins can manage districts"
    ON districts FOR ALL
    USING (is_system_admin());

CREATE POLICY "System admins can manage branches"
    ON branches FOR ALL
    USING (is_system_admin());

CREATE POLICY "System admins can manage products"
    ON products FOR ALL
    USING (is_system_admin());

-- ============================================
-- APPLICATIONS POLICIES
-- ============================================

-- Branch users can view only their own submitted applications
CREATE POLICY "Branch users view own applications"
    ON applications FOR SELECT
    USING (
        get_user_role() = 'branch_user' 
        AND submitted_by = auth.uid()
    );

-- Branch users can submit applications
CREATE POLICY "Branch users can submit applications"
    ON applications FOR INSERT
    WITH CHECK (
        get_user_role() = 'branch_user'
        AND submitted_by = auth.uid()
        AND branch_id = get_user_branch()
    );

-- Approvers can view applications based on their assignments
CREATE POLICY "Approvers view assigned applications"
    ON applications FOR SELECT
    USING (
        is_approver() 
        AND can_approver_access_application(id)
    );

-- Approvers can update applications they have access to
CREATE POLICY "Approvers can update assigned applications"
    ON applications FOR UPDATE
    USING (
        is_approver() 
        AND can_approver_access_application(id)
    );

-- System admins can view all applications
CREATE POLICY "System admins view all applications"
    ON applications FOR SELECT
    USING (is_system_admin());

-- ============================================
-- APPLICATION STATUS HISTORY POLICIES
-- ============================================

-- Users can view history for applications they can access
CREATE POLICY "View status history for accessible applications"
    ON application_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = application_id
            AND (
                -- Branch user viewing their own
                (get_user_role() = 'branch_user' AND a.submitted_by = auth.uid())
                OR
                -- Approver with access
                (is_approver() AND can_approver_access_application(a.id))
                OR
                -- System admin
                is_system_admin()
            )
        )
    );

-- Only authenticated users can insert status history (via triggers)
CREATE POLICY "Insert status history"
    ON application_status_history FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- APPROVER ASSIGNMENTS POLICIES
-- ============================================

-- System admins can manage approver assignments
CREATE POLICY "System admins manage approver assignments"
    ON approver_assignments FOR ALL
    USING (is_system_admin());

-- Approvers can view their own assignments
CREATE POLICY "Approvers view own assignments"
    ON approver_assignments FOR SELECT
    USING (approver_id = auth.uid());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- AUDIT LOG POLICIES
-- ============================================

-- System admins can view audit logs
CREATE POLICY "System admins view audit logs"
    ON audit_log FOR SELECT
    USING (is_system_admin());

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON audit_log FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
