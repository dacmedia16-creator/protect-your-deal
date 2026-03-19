
-- Add indicado_por column to afiliados for multilevel referrals
ALTER TABLE public.afiliados ADD COLUMN indicado_por uuid REFERENCES public.afiliados(id);

-- Add tipo_comissao and afiliado_id to cupons_usos for tracking direct/indirect commissions
ALTER TABLE public.cupons_usos ADD COLUMN tipo_comissao text NOT NULL DEFAULT 'direta';
ALTER TABLE public.cupons_usos ADD COLUMN afiliado_id uuid REFERENCES public.afiliados(id);

-- Backfill afiliado_id for existing cupons_usos records
UPDATE public.cupons_usos cu
SET afiliado_id = c.afiliado_id
FROM public.cupons c
WHERE cu.cupom_id = c.id AND cu.afiliado_id IS NULL;
