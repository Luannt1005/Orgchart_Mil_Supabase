-- ============================================
-- SUPABASE DATABASE SCHEMA
-- OrgChart TTI SHTP Project
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,  -- bcrypt hashed
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster login lookup
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emp_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(200),
    job_title VARCHAR(200),
    dept VARCHAR(200),
    bu VARCHAR(100),
    dl_idl_staff VARCHAR(50),
    location VARCHAR(200),
    employee_type VARCHAR(100),
    line_manager VARCHAR(200),
    joining_date VARCHAR(50),
    raw_data JSONB,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_employees_emp_id ON employees(emp_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(dept);
CREATE INDEX IF NOT EXISTS idx_employees_line_manager ON employees(line_manager);
CREATE INDEX IF NOT EXISTS idx_employees_full_name ON employees(full_name);
CREATE INDEX IF NOT EXISTS idx_employees_bu ON employees(bu);
CREATE INDEX IF NOT EXISTS idx_employees_dl_idl_staff ON employees(dl_idl_staff);

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. ORGCHART_NODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orgchart_nodes (
    id VARCHAR(200) PRIMARY KEY,
    pid VARCHAR(200),
    stpid VARCHAR(200),
    name VARCHAR(300),
    title VARCHAR(200),
    image TEXT,
    tags JSONB DEFAULT '[]'::JSONB,
    orig_pid VARCHAR(200),
    dept VARCHAR(200),
    bu VARCHAR(100),
    type VARCHAR(50),
    location VARCHAR(200),
    description TEXT,
    joining_date VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for hierarchy traversal
CREATE INDEX IF NOT EXISTS idx_orgchart_nodes_pid ON orgchart_nodes(pid);
CREATE INDEX IF NOT EXISTS idx_orgchart_nodes_stpid ON orgchart_nodes(stpid);
CREATE INDEX IF NOT EXISTS idx_orgchart_nodes_dept ON orgchart_nodes(dept);
CREATE INDEX IF NOT EXISTS idx_orgchart_nodes_type ON orgchart_nodes(type);
CREATE INDEX IF NOT EXISTS idx_orgchart_nodes_bu ON orgchart_nodes(bu);

CREATE TRIGGER update_orgchart_nodes_updated_at
    BEFORE UPDATE ON orgchart_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. CUSTOM_ORGCHARTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS custom_orgcharts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    orgchart_name VARCHAR(200) NOT NULL,
    description TEXT,
    org_data JSONB DEFAULT '{"data": []}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user's orgcharts lookup
CREATE INDEX IF NOT EXISTS idx_custom_orgcharts_username ON custom_orgcharts(username);

CREATE TRIGGER update_custom_orgcharts_updated_at
    BEFORE UPDATE ON custom_orgcharts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Note: Enabling RLS requires authenticated users
-- For now, we'll allow all operations since we're using service_role key
-- You can enable more restrictive policies later

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgchart_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orgcharts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (service role bypasses RLS)
CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON orgchart_nodes FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON custom_orgcharts FOR ALL USING (true);

-- ============================================
-- HELPFUL VIEWS (Optional)
-- ============================================

-- View for employee statistics by department
CREATE OR REPLACE VIEW employee_stats_by_dept AS
SELECT 
    dept,
    COUNT(*) as total_count,
    COUNT(CASE WHEN dl_idl_staff = 'DL' THEN 1 END) as dl_count,
    COUNT(CASE WHEN dl_idl_staff = 'IDL' THEN 1 END) as idl_count,
    COUNT(CASE WHEN dl_idl_staff = 'Staff' THEN 1 END) as staff_count
FROM employees
WHERE dept IS NOT NULL
GROUP BY dept
ORDER BY total_count DESC;

-- View for employee statistics by BU
CREATE OR REPLACE VIEW employee_stats_by_bu AS
SELECT 
    bu,
    COUNT(*) as total_count,
    COUNT(CASE WHEN dl_idl_staff = 'DL' THEN 1 END) as dl_count,
    COUNT(CASE WHEN dl_idl_staff = 'IDL' THEN 1 END) as idl_count,
    COUNT(CASE WHEN dl_idl_staff = 'Staff' THEN 1 END) as staff_count
FROM employees
WHERE bu IS NOT NULL
GROUP BY bu
ORDER BY total_count DESC;

-- ============================================
-- DONE! Tables created successfully.
-- ============================================
