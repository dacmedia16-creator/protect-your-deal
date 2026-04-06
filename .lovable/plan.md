

# Fix: Restrict backup bucket INSERT to service_role only

## Problem
The storage policy `Service role pode inserir backups` applies to `{public}` role (includes anonymous users) with only a `bucket_id` check. Any unauthenticated caller can upload files to the private `comprovantes-backup` bucket via the REST API.

## Impact
All actual uploads come from edge functions using `service_role` key (`verify-otp/index.ts` and `regenerate-backup/index.ts`). No frontend code uploads to this bucket. Restricting to `service_role` has zero functional impact.

## Fix
One SQL migration:

```sql
-- Drop the permissive policy
DROP POLICY "Service role pode inserir backups" ON storage.objects;

-- Recreate restricted to service_role only
CREATE POLICY "Service role pode inserir backups"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'comprovantes-backup');
```

## Files changed
| File | Change |
|------|--------|
| New migration | 1 DROP + 1 CREATE POLICY |

No frontend or edge function changes needed.

