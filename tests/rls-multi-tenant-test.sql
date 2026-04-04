-- ============================================================
-- RLS Multi-Tenant Isolation — Static Analysis Report
-- ============================================================
-- Verifies that all SELECT/INSERT/UPDATE/DELETE policies on
-- tenant-sensitive tables correctly filter by auth.uid(),
-- user_id, imobiliaria_id, or construtora_id.
--
-- This script does NOT modify data. Safe to run anytime.
-- Usage: psql -f tests/rls-multi-tenant-test.sql
-- ============================================================

-- 1. Tables WITHOUT RLS enabled (should be empty for public schema)
SELECT '=== TABLES WITHOUT RLS ===' AS section;
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
  );

-- 2. Tenant-sensitive tables: verify all policies use auth.uid()
SELECT '=== POLICY ANALYSIS: fichas_visita ===' AS section;
SELECT policyname, cmd,
  CASE WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'OK: uses auth.uid()'
       WHEN roles = '{service_role}' THEN 'OK: service_role only'
       ELSE 'WARNING: no auth.uid() check'
  END AS isolation_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'fichas_visita'
ORDER BY cmd;

SELECT '=== POLICY ANALYSIS: clientes ===' AS section;
SELECT policyname, cmd,
  CASE WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'OK: uses auth.uid()'
       WHEN roles = '{service_role}' THEN 'OK: service_role only'
       ELSE 'WARNING: no auth.uid() check'
  END AS isolation_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'clientes'
ORDER BY cmd;

SELECT '=== POLICY ANALYSIS: imoveis ===' AS section;
SELECT policyname, cmd,
  CASE WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'OK: uses auth.uid()'
       WHEN roles = '{service_role}' THEN 'OK: service_role only'
       ELSE 'WARNING: no auth.uid() check'
  END AS isolation_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'imoveis'
ORDER BY cmd;

SELECT '=== POLICY ANALYSIS: audit_logs ===' AS section;
SELECT policyname, cmd,
  CASE WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'OK: uses auth.uid()'
       WHEN roles = '{service_role}' THEN 'OK: service_role only'
       ELSE 'WARNING: no auth.uid() check'
  END AS isolation_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'audit_logs'
ORDER BY cmd;

-- 3. audit_logs immutability: confirm no UPDATE/DELETE policies exist
SELECT '=== AUDIT_LOGS IMMUTABILITY ===' AS section;
SELECT cmd, count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'audit_logs'
GROUP BY cmd
ORDER BY cmd;

-- 4. Cross-check: fichas_visita SELECT policies all use user_id or imobiliaria_id filter
SELECT '=== FICHAS CROSS-TENANT FILTER CHECK ===' AS section;
SELECT policyname,
  CASE
    WHEN qual LIKE '%user_id = auth.uid()%' THEN 'FILTERED: user_id = auth.uid()'
    WHEN qual LIKE '%imobiliaria_id = get_user_imobiliaria%' THEN 'FILTERED: imobiliaria_id'
    WHEN qual LIKE '%construtora_id = get_user_construtora%' THEN 'FILTERED: construtora_id'
    WHEN qual LIKE '%corretor_parceiro_id = auth.uid()%' THEN 'FILTERED: corretor_parceiro_id'
    WHEN qual LIKE '%lider_id = auth.uid()%' THEN 'FILTERED: equipe lider'
    WHEN qual LIKE '%is_super_admin%' THEN 'FILTERED: super_admin only'
    ELSE 'REVIEW NEEDED: ' || left(coalesce(qual, 'no qual'), 80)
  END AS filter_type
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'fichas_visita' AND cmd = 'SELECT'
ORDER BY policyname;
