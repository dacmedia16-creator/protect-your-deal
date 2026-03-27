

## Plano: Adicionar toggle de Pesquisa Pós-Visita na listagem de Construtoras

### Problema
O dropdown de ações na página AdminConstrutoras não possui a opção "Habilitar/Desabilitar Pesquisa", que já existe para Imobiliárias e Corretores Autônomos.

### Solução

#### 1. Migração: criar tabela `construtora_feature_flags`
Seguir o mesmo padrão de `imobiliaria_feature_flags`:

```sql
CREATE TABLE public.construtora_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  construtora_id uuid NOT NULL REFERENCES public.construtoras(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (construtora_id, feature_key)
);

ALTER TABLE public.construtora_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage construtora feature flags"
  ON public.construtora_feature_flags FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Construtora admins can read own flags"
  ON public.construtora_feature_flags FOR SELECT TO authenticated
  USING (public.is_construtora_admin(auth.uid(), construtora_id));
```

#### 2. Atualizar `AdminConstrutoras.tsx`
- Adicionar `survey_enabled` à interface `Construtora`
- No `fetchConstrutoras`, buscar flag de `construtora_feature_flags` (feature_key = `post_visit_survey`)
- Adicionar função `toggleSurveyFeature` que faz upsert na tabela
- Adicionar item no dropdown: ícone `ClipboardCheck` + texto "Habilitar/Desabilitar Pesquisa"
- Adicionar state `isTogglingFeature` para feedback de loading

#### 3. Detalhes técnicos
- O upsert usa `onConflict: 'construtora_id,feature_key'` (mesmo padrão de imobiliárias)
- A flag será consultada nas fichas da construtora para decidir se envia pesquisa pós-visita

