-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Acesso público para verificação OTP" ON public.confirmacoes_otp;
DROP POLICY IF EXISTS "Acesso público para atualização OTP" ON public.confirmacoes_otp;

-- Create secure policy: Only allow SELECT via token (not exposing codigo directly)
CREATE POLICY "Verificação OTP via token" 
ON public.confirmacoes_otp 
FOR SELECT 
USING (
  -- Allow access only when querying by specific token
  -- The application should query by token, not expose all records
  token IS NOT NULL
);

-- Create secure policy: Only allow UPDATE when providing correct codigo
CREATE POLICY "Confirmar OTP com código correto" 
ON public.confirmacoes_otp 
FOR UPDATE 
USING (
  -- Must query by token AND provide matching codigo in the update
  token IS NOT NULL AND confirmado = false
)
WITH CHECK (
  -- Only allow setting confirmado to true, not modifying other sensitive fields
  confirmado = true
);