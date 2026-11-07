-- Sandbox Database Initialization Script
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create unprivileged role for student queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'student_sandbox_user') THEN
        CREATE ROLE student_sandbox_user WITH LOGIN PASSWORD 'sandbox_safe_pw' NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;
END
$$;

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO student_sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO student_sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO student_sandbox_user;

-- Allow student_sandbox_user to create temporary tables/schemas if needed for DDL assignments
GRANT CREATE ON DATABASE sandbox_db TO student_sandbox_user;
