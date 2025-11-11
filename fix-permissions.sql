-- Grant privileges on public schema to mypak_kavop_app
-- Run this as the database owner/admin user

GRANT CREATE ON SCHEMA public TO mypak_kavop_app;
GRANT USAGE ON SCHEMA public TO mypak_kavop_app;

-- Grant privileges on all existing tables (if any)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mypak_kavop_app;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL PRIVILEGES ON TABLES TO mypak_kavop_app;
