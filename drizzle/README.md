# Database Migrations

## Permission Issue

The application database user (`mypak_kavop_app`) does not have CREATE TABLE permissions on the `public` schema.

## Manual Migration Required

**For DBA:** Please run the following SQL as a superuser or schema owner:

```bash
psql -h 152.53.36.121 -p 9803 -U <admin_user> -d mypak_kavop_staging -f drizzle/manual-migration.sql
```

Or execute the SQL manually from `drizzle/manual-migration.sql`.

## Alternative: Run Migration Script

If you have the DATABASE_URL with admin credentials, run:

```bash
node scripts/run-migration.mjs
```

## Verify Tables Created

After running the migration, verify tables exist:

```sql
\dt
SELECT * FROM organizations LIMIT 1;
SELECT * FROM users LIMIT 1;
```
