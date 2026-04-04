

# Fix: "record_id is of type uuid but expression is of type text"

## Problem
Both audit trigger functions (`audit_fichas_visita_delete` and `audit_fichas_visita_changes`) cast `OLD.id::text` / `NEW.id::text` when inserting into `audit_logs.record_id`, but that column is type `uuid`. Postgres rejects the implicit text→uuid conversion in a `SECURITY DEFINER` context.

## Fix
One database migration to replace both trigger functions, removing the `::text` cast so `OLD.id` and `NEW.id` (already uuid) are passed directly to the uuid column.

### Migration SQL
```sql
CREATE OR REPLACE FUNCTION audit_fichas_visita_delete()
  -- same body, change OLD.id::text → OLD.id

CREATE OR REPLACE FUNCTION audit_fichas_visita_changes()
  -- same body, change NEW.id::text → NEW.id
```

## Impact
- Fixes the delete error shown in the screenshot
- Fixes the same latent bug in the UPDATE trigger
- No schema change, no new tables, no frontend changes

