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

-- Enforce default transaction read-only on the unprivileged student role
ALTER ROLE student_sandbox_user SET default_transaction_read_only = on;

-- Revoke dangerous permissions on database and public schema
REVOKE ALL ON DATABASE sandbox_db FROM student_sandbox_user;
REVOKE CREATE ON SCHEMA public FROM student_sandbox_user;

-- Grant connect and strictly read-only SELECT permissions
GRANT CONNECT ON DATABASE sandbox_db TO student_sandbox_user;
GRANT USAGE ON SCHEMA public TO student_sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO student_sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO student_sandbox_user;
