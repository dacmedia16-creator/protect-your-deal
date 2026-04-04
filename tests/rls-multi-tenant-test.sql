-- ============================================================
-- RLS Multi-Tenant Isolation Test Script — VisitaProva
-- ============================================================
-- Runs inside a transaction with ROLLBACK — zero side effects.
-- Usage: psql -f tests/rls-multi-tenant-test.sql
-- ============================================================

BEGIN;

DO $test$
DECLARE
  pass_count int := 0;
  fail_count int := 0;
  total_count int := 0;
  cnt bigint;
  cnt_other bigint;

  -- Test users (real data)
  corretor_a_id uuid := '48d00459-bb72-4e84-bf57-57b6718b8128';
  corretor_a_imob uuid := 'b0a5a0e1-d09b-46e7-9d57-e85ad6c998dc';
  corretor_b_id uuid := '324f18dc-4a98-42ae-9f2d-91b7dacfd22c';
  corretor_b_imob uuid := 'c90ca237-1e02-4225-864e-b8fb7574c354';
BEGIN

  -- Simulate Corretor A
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', corretor_a_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_a_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  -- TEST 1: Corretor A sees own fichas
  SELECT count(*) INTO cnt FROM fichas_visita;
  total_count := total_count + 1;
  IF cnt > 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [1a] Corretor A sees % fichas', cnt;
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [1a] Corretor A sees 0 fichas';
  END IF;

  -- TEST 1b: No cross-tenant fichas
  SELECT count(*) INTO cnt_other FROM fichas_visita WHERE imobiliaria_id = corretor_b_imob;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [1b] Corretor A sees 0 fichas from imob B';
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [1b] Corretor A sees % fichas from imob B', cnt_other;
  END IF;

  -- Simulate Corretor B
  PERFORM set_config('request.jwt.claim.sub', corretor_b_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_b_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  -- TEST 2: Corretor B sees own fichas
  SELECT count(*) INTO cnt FROM fichas_visita;
  total_count := total_count + 1;
  IF cnt > 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [2a] Corretor B sees % fichas', cnt;
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [2a] Corretor B sees 0 fichas';
  END IF;

  -- TEST 2b: No cross-tenant fichas
  SELECT count(*) INTO cnt_other FROM fichas_visita WHERE imobiliaria_id = corretor_a_imob;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [2b] Corretor B sees 0 fichas from imob A';
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [2b] Corretor B sees % fichas from imob A', cnt_other;
  END IF;

  -- Back to Corretor A for clientes
  PERFORM set_config('request.jwt.claim.sub', corretor_a_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_a_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  -- TEST 3: Corretor A clientes
  SELECT count(*) INTO cnt FROM clientes;
  total_count := total_count + 1;
  IF cnt > 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [3a] Corretor A sees % clientes', cnt;
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [3a] Corretor A sees 0 clientes';
  END IF;

  SELECT count(*) INTO cnt_other FROM clientes WHERE imobiliaria_id = corretor_b_imob;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [3b] Corretor A sees 0 clientes from imob B';
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [3b] Corretor A sees % clientes from imob B', cnt_other;
  END IF;

  -- Corretor B clientes
  PERFORM set_config('request.jwt.claim.sub', corretor_b_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_b_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  -- TEST 4: Corretor B clientes
  SELECT count(*) INTO cnt FROM clientes;
  total_count := total_count + 1;
  IF cnt > 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [4a] Corretor B sees % clientes', cnt;
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [4a] Corretor B sees 0 clientes';
  END IF;

  SELECT count(*) INTO cnt_other FROM clientes WHERE imobiliaria_id = corretor_a_imob;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [4b] Corretor B sees 0 clientes from imob A';
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [4b] Corretor B sees % clientes from imob A', cnt_other;
  END IF;

  -- Corretor A imoveis
  PERFORM set_config('request.jwt.claim.sub', corretor_a_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_a_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  -- TEST 5: Corretor A imoveis
  SELECT count(*) INTO cnt FROM imoveis;
  total_count := total_count + 1;
  IF cnt > 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [5a] Corretor A sees % imoveis', cnt;
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [5a] Corretor A sees 0 imoveis';
  END IF;

  SELECT count(*) INTO cnt_other FROM imoveis WHERE imobiliaria_id = corretor_b_imob;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [5b] Corretor A sees 0 imoveis from imob B';
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [5b] Corretor A sees % imoveis from imob B', cnt_other;
  END IF;

  -- Corretor B imoveis
  PERFORM set_config('request.jwt.claim.sub', corretor_b_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_b_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  -- TEST 6: Corretor B imoveis
  SELECT count(*) INTO cnt FROM imoveis;
  total_count := total_count + 1;
  IF cnt > 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [6a] Corretor B sees % imoveis', cnt;
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [6a] Corretor B sees 0 imoveis';
  END IF;

  SELECT count(*) INTO cnt_other FROM imoveis WHERE imobiliaria_id = corretor_a_imob;
  total_count := total_count + 1;
  IF cnt_other = 0 THEN pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [6b] Corretor B sees 0 imoveis from imob A';
  ELSE fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [6b] Corretor B sees % imoveis from imob A', cnt_other;
  END IF;

  -- TEST 7: audit_logs INSERT VIEW allowed
  PERFORM set_config('request.jwt.claim.sub', corretor_a_id::text, true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', corretor_a_id::text, 'role', 'authenticated',
    'iss', 'supabase', 'iat', extract(epoch from now())::int,
    'exp', extract(epoch from (now() + interval '1 hour'))::int
  )::text, true);

  BEGIN
    INSERT INTO audit_logs (action, table_name, user_id, record_id)
    VALUES ('VIEW', 'fichas_visita', corretor_a_id, gen_random_uuid());
    total_count := total_count + 1; pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [7a] INSERT VIEW audit_log allowed';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1; fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [7a] INSERT VIEW blocked: %', SQLERRM;
  END;

  -- TEST 8: audit_logs INSERT UPDATE blocked
  BEGIN
    INSERT INTO audit_logs (action, table_name, user_id, record_id)
    VALUES ('UPDATE', 'fichas_visita', corretor_a_id, gen_random_uuid());
    total_count := total_count + 1; fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [8a] INSERT UPDATE allowed (should be blocked)';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1; pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [8a] INSERT UPDATE blocked';
  END;

  -- TEST 9: audit_logs spoofing user_id blocked
  BEGIN
    INSERT INTO audit_logs (action, table_name, user_id, record_id)
    VALUES ('VIEW', 'fichas_visita', corretor_b_id, gen_random_uuid());
    total_count := total_count + 1; fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [9a] user_id spoofing allowed';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1; pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [9a] user_id spoofing blocked';
  END;

  -- TEST 10: audit_logs UPDATE blocked
  BEGIN
    UPDATE audit_logs SET action = 'TAMPERED' WHERE user_id = corretor_a_id;
    total_count := total_count + 1; fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [10a] UPDATE audit_logs allowed';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1; pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [10a] UPDATE audit_logs blocked';
  END;

  -- TEST 11: audit_logs DELETE blocked
  BEGIN
    DELETE FROM audit_logs WHERE user_id = corretor_a_id;
    total_count := total_count + 1; fail_count := fail_count + 1;
    RAISE NOTICE 'FAIL [11a] DELETE audit_logs allowed';
  EXCEPTION WHEN OTHERS THEN
    total_count := total_count + 1; pass_count := pass_count + 1;
    RAISE NOTICE 'PASS [11a] DELETE audit_logs blocked';
  END;

  -- SUMMARY
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Multi-Tenant Test Results';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total: %  |  PASS: %  |  FAIL: %', total_count, pass_count, fail_count;
  IF fail_count = 0 THEN
    RAISE NOTICE 'STATUS: ALL TESTS PASSED';
  ELSE
    RAISE NOTICE 'STATUS: % FAILURES DETECTED', fail_count;
  END IF;
  RAISE NOTICE '========================================';

END;
$test$;

ROLLBACK;
