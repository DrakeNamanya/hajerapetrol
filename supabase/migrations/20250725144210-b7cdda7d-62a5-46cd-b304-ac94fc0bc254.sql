-- Update sales table status to support multi-level approval workflow
-- Current statuses: pending, accountant_approved, approved, rejected
-- New workflow: pending -> accountant_approved -> manager_approved -> director_approved

-- First, let's see what data is in the table
SELECT DISTINCT status FROM sales;

-- Update the sales table to support the new workflow
-- Add columns for multi-level approval tracking
ALTER TABLE sales ADD COLUMN IF NOT EXISTS approved_by_director uuid;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS director_approved_at timestamp with time zone;

-- Create an enum for sales status to ensure consistency
CREATE TYPE sales_status AS ENUM (
    'pending',
    'accountant_approved', 
    'manager_approved',
    'director_approved',
    'rejected'
);

-- Update the status column to use the enum (this will preserve existing data)
ALTER TABLE sales ALTER COLUMN status TYPE sales_status USING status::sales_status;

-- Add a comment to document the approval workflow
COMMENT ON COLUMN sales.status IS 'Sales approval workflow: pending -> accountant_approved -> manager_approved -> director_approved';
COMMENT ON TABLE sales IS 'Sales data with multi-level approval workflow: Cashier -> Accountant -> Manager -> Director';

-- Update RLS policies to allow directors to approve sales
CREATE POLICY "Directors can update sales status" ON sales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'director'
        )
    );

-- Also update lubricant sales to have the same workflow
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS approved_by_accountant uuid;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS approved_by_manager uuid;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS approved_by_director uuid;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS accountant_approved_at timestamp with time zone;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS manager_approved_at timestamp with time zone;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS director_approved_at timestamp with time zone;

-- Update lubricant sales status column to use the same enum
ALTER TABLE lubricant_sales ALTER COLUMN status TYPE sales_status USING status::sales_status;

-- Create policy for lubricant sales approvals
CREATE POLICY "Managers and directors can update lubricant sales status" ON lubricant_sales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'director', 'accountant')
        )
    );