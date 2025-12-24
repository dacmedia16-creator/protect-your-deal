-- Lock down confirmacoes_otp: remove public access policies added previously
DROP POLICY IF EXISTS "Verificação OTP via token" ON public.confirmacoes_otp;
DROP POLICY IF EXISTS "Confirmar OTP com código correto" ON public.confirmacoes_otp;

-- Ensure RLS remains enabled
ALTER TABLE public.confirmacoes_otp ENABLE ROW LEVEL SECURITY;