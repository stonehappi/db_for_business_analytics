#!/bin/sh
set -e

STUDENT_PW="${STUDENT_SANDBOX_PASSWORD:-sandbox_safe_pw}"

echo "[Sandbox-Init] Initializing sandbox database with secure role permissions..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    DO \$\$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'student_sandbox_user') THEN
            CREATE ROLE student_sandbox_user WITH LOGIN PASSWORD '$STUDENT_PW' NOSUPERUSER NOCREATEDB NOCREATEROLE;
        ELSE
            ALTER ROLE student_sandbox_user WITH PASSWORD '$STUDENT_PW';
        END IF;
    END
    \$\$;

    -- Enforce default transaction read-only on the unprivileged student role
    ALTER ROLE student_sandbox_user SET default_transaction_read_only = on;

    -- Revoke dangerous permissions on database and public schema
    REVOKE ALL ON DATABASE "$POSTGRES_DB" FROM student_sandbox_user;
    REVOKE CREATE ON SCHEMA public FROM student_sandbox_user;

    -- Grant connect and strictly read-only SELECT permissions
    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO student_sandbox_user;
    GRANT USAGE ON SCHEMA public TO student_sandbox_user;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO student_sandbox_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO student_sandbox_user;
EOSQL

echo "[Sandbox-Init] Sandbox database initialization completed."
