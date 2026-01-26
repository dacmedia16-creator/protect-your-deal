-- =============================================
-- FIX: Remove public access to cupons table
-- The validar_cupom() RPC function already exists for secure validation
-- =============================================

-- 1. Drop the policy that exposes all active coupons publicly
DROP POLICY IF EXISTS "Anyone can read active cupons for validation" ON public.cupons;

-- 2. The existing policies remain:
--    - "Afiliado pode ver seus cupons" (affiliates see their own)
--    - "Super admins can manage cupons" (full admin access)
-- 
-- Public validation should use the validar_cupom() RPC function
-- which returns only validation result, not full coupon data