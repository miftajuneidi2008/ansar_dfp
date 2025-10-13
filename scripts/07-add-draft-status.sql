-- Add 'draft' status to application_status enum
ALTER TYPE application_status ADD VALUE 'draft';

-- Update RLS policies to allow branch users to update their own draft applications
DROP POLICY IF EXISTS "Branch users can update their own draft applications" ON applications;

CREATE POLICY "Branch users can update their own draft applications"
ON applications
FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'branch_user' AND id = applications.submitted_by
  )
  AND status = 'draft'
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'branch_user' AND id = applications.submitted_by
  )
  AND status IN ('draft', 'pending')
);
