-- =====================================================
-- Migration: Add missing columns to employees table
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add missing columns to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS bu_org_3 TEXT,
ADD COLUMN IF NOT EXISTS last_working_day TEXT,
ADD COLUMN IF NOT EXISTS line_manager_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_line_manager TEXT;

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_employees_bu_org_3 ON employees(bu_org_3);
CREATE INDEX IF NOT EXISTS idx_employees_line_manager_status ON employees(line_manager_status);

-- Optional: Drop raw_data column if you don't need it
-- Uncomment the line below after verifying data migration is complete
-- ALTER TABLE employees DROP COLUMN IF EXISTS raw_data;

-- =====================================================
-- IMPORTANT: After adding columns, you may need to 
-- migrate data from raw_data to the new columns
-- =====================================================

-- Example: Migrate data from raw_data to new columns (if needed)
-- UPDATE employees 
-- SET 
--   bu_org_3 = raw_data->>'BU Org 3',
--   last_working_day = COALESCE(raw_data->>'Last Working Day', raw_data->>'Last Working\r\nDay')
-- WHERE raw_data IS NOT NULL;

-- =====================================================
-- Verify the changes
-- =====================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'employees';
