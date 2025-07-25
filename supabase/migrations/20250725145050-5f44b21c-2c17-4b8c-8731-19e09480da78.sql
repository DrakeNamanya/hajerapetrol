-- Drop the existing check constraint first, then proceed with the migration

-- Find and drop the existing check constraint on sales.status
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;

-- First, add the new columns for multi-level approval
ALTER TABLE sales ADD COLUMN IF NOT EXISTS approved_by_director uuid;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS director_approved_at timestamp with time zone;

-- Add the same columns to lubricant_sales if they don't exist
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS approved_by_accountant uuid;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS approved_by_manager uuid;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS approved_by_director uuid;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS accountant_approved_at timestamp with time zone;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS manager_approved_at timestamp with time zone;
ALTER TABLE lubricant_sales ADD COLUMN IF NOT EXISTS director_approved_at timestamp with time zone;

-- Create the enum type for sales status
DO $$ BEGIN
    CREATE TYPE sales_status AS ENUM (
        'pending',
        'accountant_approved', 
        'manager_approved',
        'director_approved',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Map existing status values to new enum values before type conversion
UPDATE sales SET status = 'director_approved' WHERE status = 'approved';

-- Now safely update the column type
ALTER TABLE sales ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE sales ALTER COLUMN status TYPE sales_status USING 
    CASE 
        WHEN status = 'pending' THEN 'pending'::sales_status
        WHEN status = 'accountant_approved' THEN 'accountant_approved'::sales_status
        WHEN status = 'manager_approved' THEN 'manager_approved'::sales_status
        WHEN status = 'director_approved' THEN 'director_approved'::sales_status
        WHEN status = 'approved' THEN 'director_approved'::sales_status
        WHEN status = 'rejected' THEN 'rejected'::sales_status
        ELSE 'pending'::sales_status
    END;

-- Update lubricant sales status column 
ALTER TABLE lubricant_sales ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE lubricant_sales ALTER COLUMN status TYPE sales_status USING 
    CASE 
        WHEN status = 'pending' THEN 'pending'::sales_status
        WHEN status = 'accountant_approved' THEN 'accountant_approved'::sales_status
        WHEN status = 'manager_approved' THEN 'manager_approved'::sales_status
        WHEN status = 'director_approved' THEN 'director_approved'::sales_status
        WHEN status = 'approved' THEN 'director_approved'::sales_status
        WHEN status = 'rejected' THEN 'rejected'::sales_status
        ELSE 'pending'::sales_status
    END;

-- Add comments to document the approval workflow
COMMENT ON COLUMN sales.status IS 'Sales approval workflow: pending -> accountant_approved -> manager_approved -> director_approved';
COMMENT ON TABLE sales IS 'Sales data with multi-level approval workflow: Cashier -> Accountant -> Manager -> Director';

-- Update RLS policies to allow directors to approve sales (drop existing if it exists)
DROP POLICY IF EXISTS "Directors can update sales status" ON sales;
CREATE POLICY "Directors can update sales status" ON sales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'director'
        )
    );

-- Create policy for lubricant sales approvals (drop existing if it exists)  
DROP POLICY IF EXISTS "Managers and directors can update lubricant sales status" ON lubricant_sales;
CREATE POLICY "Managers and directors can update lubricant sales status" ON lubricant_sales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('manager', 'director', 'accountant')
        )
    );