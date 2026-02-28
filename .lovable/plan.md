

## Problem

The `admin-update-user` edge function returns a raw PostgreSQL constraint violation error (code 23505) when the admin tries to set a phone number that already exists on another profile. The error message is technical and unhelpful.

## Fix

**File**: `supabase/functions/admin-update-user/index.ts`

Add a check for duplicate phone constraint error (code `23505`) in the profile update section and return a user-friendly message like "Este telefone já está em uso por outro usuário."

Specifically, after the profile update call (around line 126-133), check:
```typescript
if (profileError) {
  if (profileError.code === '23505' && profileError.message.includes('telefone')) {
    return Response with 400: "Este telefone já está em uso por outro usuário"
  }
  // existing generic error handling
}
```

This is a single change in one file (edge function), no frontend changes needed since the frontend already displays the error message from the response.

