-- Add CRECI Jurídico column to imobiliarias table
ALTER TABLE public.imobiliarias 
ADD COLUMN creci_juridico text;

COMMENT ON COLUMN public.imobiliarias.creci_juridico IS 'CRECI Jurídico da imobiliária (registro PJ)';