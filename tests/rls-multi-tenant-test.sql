-- ============================================================
-- RLS Multi-Tenant Isolation Test Script — VisitaProva
-- ============================================================
-- Tests that corretores from different imobiliárias cannot see
-- each other's data via RLS policies.
--
-- Uses real user IDs from production data. Runs inside a
-- transaction with ROLLBACK — zero side effects.
--
-- Usage: psql -f tests/rls-multi-tenant-test.sql
-- ============================================================

BEGIN;

-- ============================================================
-- Test users (from real data)
-- ============================================================
-- Corretor A: imob b0a5a0e1 (23 fichas, 23 clientes, 18 imoveis)
-- Corretor B: imob c90ca237 (6 fichas, 9 clientes, 3 imoveis)
-- Admin 1:    imob b0a5a0e1 (imobiliaria_admin)
-- Super Admin: 726c5b8a (no imobiliaria_id)

\set corretor_a_id '48d00459-bb72-4e84-bf57-57b6718b8128'
\set corretor_a_imob 'b0a5a0e1-d09b-46e7-9d57-e85ad6c998dc'

\set corretor_b_id '324f18dc-4a98-42ae-9f2d-91b7dacfd22c'
\set corretor_b_imob 'c90ca237-1e02-4225-864e-b8fb7574c354'

\set admin_1_id '2de39423-4aff-42db-9a57-c15414b5cfa6'
\set admin_1_imob 'b0a5a0e1-d09b-46e7-9d57-e85ad6c998dc'

\set super_admin_id '726c5b8a-e204-4970-9504-7fc907979db0'

-- ============================================================
-- Helper: simulate authenticated user context
-- ============================================================
-- Sets role to 'authenticated' and injects JWT claims
-- so RLS policies using auth.uid() work correctly.

CREATE OR REPLACE FUNCTION _test_set_user(uid uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', uid::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', uid::text,
    'role', 'authenticated',
    'iss', 'supabase',
    'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);
END;
$$;

-- ============================================================
-- Counters
-- ============================================================
DO $test$
DECLARE
  pass_count int := 0;
  fail_count int := 0;
  total_count int := 0;
  cnt bigint;
  cnt_other bigint;
BEGIN

  -- ========================================================
  -- TEST 1: Corretor A sees only own fichas
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  SELECT count(*) INTO cnt FROM fichas_visita;
  total_count := total_count + 1;
  IF cnt > 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [1a] Corretor A sees % fichas', cnt;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [1a] Corretor A sees 0 fichas (expected > 0)';
  END IF;

  -- Corretor A must NOT see fichas from Corretor B's imobiliaria
  SELECT count(*) INTO cnt_other FROM fichas_visita
    WHERE imobiliaria_id = :'corretor_b_imob'::uuid;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [1b] Corretor A sees 0 fichas from imob B';
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [1b] Corretor A sees % fichas from imob B (expected 0)', cnt_other;
  END IF;

  -- ========================================================
  -- TEST 2: Corretor B sees only own fichas
  -- ========================================================
  PERFORM _test_set_user(:'corretor_b_id'::uuid);
  
  SELECT count(*) INTO cnt FROM fichas_visita;
  total_count := total_count + 1;
  IF cnt > 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [2a] Corretor B sees % fichas', cnt;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [2a] Corretor B sees 0 fichas (expected > 0)';
  END IF;

  SELECT count(*) INTO cnt_other FROM fichas_visita
    WHERE imobiliaria_id = :'corretor_a_imob'::uuid;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [2b] Corretor B sees 0 fichas from imob A';
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [2b] Corretor B sees % fichas from imob A (expected 0)', cnt_other;
  END IF;

  -- ========================================================
  -- TEST 3: Corretor A - clientes isolation
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  SELECT count(*) INTO cnt FROM clientes;
  total_count := total_count + 1;
  IF cnt > 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [3a] Corretor A sees % clientes', cnt;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [3a] Corretor A sees 0 clientes (expected > 0)';
  END IF;

  SELECT count(*) INTO cnt_other FROM clientes
    WHERE imobiliaria_id = :'corretor_b_imob'::uuid;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [3b] Corretor A sees 0 clientes from imob B';
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [3b] Corretor A sees % clientes from imob B (expected 0)', cnt_other;
  END IF;

  -- ========================================================
  -- TEST 4: Corretor B - clientes isolation
  -- ========================================================
  PERFORM _test_set_user(:'corretor_b_id'::uuid);
  
  SELECT count(*) INTO cnt FROM clientes;
  total_count := total_count + 1;
  IF cnt > 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [4a] Corretor B sees % clientes', cnt;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [4a] Corretor B sees 0 clientes (expected > 0)';
  END IF;

  SELECT count(*) INTO cnt_other FROM clientes
    WHERE imobiliaria_id = :'corretor_a_imob'::uuid;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [4b] Corretor B sees 0 clientes from imob A';
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [4b] Corretor B sees % clientes from imob A (expected 0)', cnt_other;
  END IF;

  -- ========================================================
  -- TEST 5: Corretor A - imoveis isolation
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  SELECT count(*) INTO cnt FROM imoveis;
  total_count := total_count + 1;
  IF cnt > 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [5a] Corretor A sees % imoveis', cnt;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [5a] Corretor A sees 0 imoveis (expected > 0)';
  END IF;

  SELECT count(*) INTO cnt_other FROM imoveis
    WHERE imobiliaria_id = :'corretor_b_imob'::uuid;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [5b] Corretor A sees 0 imoveis from imob B';
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [5b] Corretor A sees % imoveis from imob B (expected 0)', cnt_other;
  END IF;

  -- ========================================================
  -- TEST 6: Corretor B - imoveis isolation
  -- ========================================================
  PERFORM _test_set_user(:'corretor_b_id'::uuid);
  
  SELECT count(*) INTO cnt FROM imoveis;
  total_count := total_count + 1;
  IF cnt > 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [6a] Corretor B sees % imoveis', cnt;
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [6a] Corretor B sees 0 imoveis (expected > 0)';
  END IF;

  SELECT count(*) INTO cnt_other FROM imoveis
    WHERE imobiliaria_id = :'corretor_a_imob'::uuid;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [6b] Corretor B sees 0 imoveis from imob A';
  ELSE
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [6b] Corretor B sees % imoveis from imob A (expected 0)', cnt_other;
  END IF;

  -- ========================================================
  -- TEST 7: audit_logs INSERT - VIEW action allowed
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  BEGIN
    INSERT INTO audit_logs (action, table_name, user_id, record_id)
    VALUES ('VIEW', 'fichas_visita', :'corretor_a_id'::uuid, gen_random_uuid());
    
    total_count := total_count + 1;
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [7a] Corretor A can INSERT VIEW log';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1;
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [7a] Corretor A cannot INSERT VIEW log: %', SQLERRM;
  END;

  -- ========================================================
  -- TEST 8: audit_logs INSERT - UPDATE action blocked
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  BEGIN
    INSERT INTO audit_logs (action, table_name, user_id, record_id)
    VALUES ('UPDATE', 'fichas_visita', :'corretor_a_id'::uuid, gen_random_uuid());
    
    total_count := total_count + 1;
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [8a] Corretor A CAN INSERT UPDATE log (should be blocked)';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1;
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [8a] Corretor A blocked from INSERT UPDATE log';
  END;

  -- ========================================================
  -- TEST 9: audit_logs INSERT - spoofing user_id blocked
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  BEGIN
    INSERT INTO audit_logs (action, table_name, user_id, record_id)
    VALUES ('VIEW', 'fichas_visita', :'corretor_b_id'::uuid, gen_random_uuid());
    
    total_count := total_count + 1;
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [9a] Corretor A CAN spoof user_id in audit_logs';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1;
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [9a] Corretor A blocked from spoofing user_id';
  END;

  -- ========================================================
  -- TEST 10: audit_logs immutability — no UPDATE
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  BEGIN
    UPDATE audit_logs SET action = 'TAMPERED' WHERE user_id = :'corretor_a_id'::uuid;
    
    total_count := total_count + 1;
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [10a] Corretor A CAN UPDATE audit_logs';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1;
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [10a] audit_logs UPDATE blocked';
  END;

  -- ========================================================
  -- TEST 11: audit_logs immutability — no DELETE
  -- ========================================================
  PERFORM _test_set_user(:'corretor_a_id'::uuid);
  
  BEGIN
    DELETE FROM audit_logs WHERE user_id = :'corretor_a_id'::uuid;
    
    total_count := total_count + 1;
    fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [11a] Corretor A CAN DELETE audit_logs';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1;
    pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [11a] audit_logs DELETE blocked';
  END;

  -- ========================================================
  -- SUMMARY
  -- ========================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Multi-Tenant Test Results';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total: %  |  PASS: %  |  FAIL: %', total_count, pass_count, fail_count;
  
  IF fail_count = 0 THEN
    RAISE NOTICE 'STATUS: ALL TESTS PASSED ✓';
  ELSE
    RAISE NOTICE 'STATUS: % FAILURES DETECTED ✗', fail_count;
  END IF;
  RAISE NOTICE '========================================';

END;
$test$;

-- Clean up helper function and rollback all changes
DROP FUNCTION IF EXISTS _test_set_user(uuid);
ROLLBACK;
