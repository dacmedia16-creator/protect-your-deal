

# Plano: Vincular Empreendimentos às Equipes da Construtora

## Resumo

Criar uma tabela de relacionamento `equipe_empreendimentos` e adicionar um botão/dialog nas equipes da construtora para vincular/desvincular empreendimentos, similar ao que as imobiliárias parceiras já possuem com `empreendimento_imobiliarias`.

## Etapas

### 1. Migração: criar tabela `equipe_empreendimentos`

```sql
CREATE TABLE public.equipe_empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id uuid NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
  empreendimento_id uuid NOT NULL REFERENCES empreendimentos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipe_id, empreendimento_id)
);

ALTER TABLE public.equipe_empreendimentos ENABLE ROW LEVEL SECURITY;

-- Construtora admin pode gerenciar
CREATE POLICY "Construtora admin gerencia equipe_empreendimentos"
ON public.equipe_empreendimentos FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM equipes e
  WHERE e.id = equipe_empreendimentos.equipe_id
    AND e.construtora_id IS NOT NULL
    AND is_construtora_admin(auth.uid(), e.construtora_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM equipes e
  WHERE e.id = equipe_empreendimentos.equipe_id
    AND e.construtora_id IS NOT NULL
    AND is_construtora_admin(auth.uid(), e.construtora_id)
));

-- Super admin full access
CREATE POLICY "Super admin full access equipe_empreendimentos"
ON public.equipe_empreendimentos FOR ALL TO public
USING (is_super_admin(auth.uid()));
```

### 2. Alterar `src/pages/construtora/ConstutoraEquipes.tsx`

- **Carregar empreendimentos** da construtora no `fetchData` (query `empreendimentos` onde `construtora_id = construtoraId`)
- **Carregar vínculos** existentes da tabela `equipe_empreendimentos`
- **Novo estado**: `empDialogOpen`, `empVinculos`, `empreendimentos`
- **Novo botão** no card da equipe: ícone `Building` para abrir dialog de vincular empreendimentos
- **Dialog de vínculos**: lista de empreendimentos com checkboxes (toggle insert/delete na tabela `equipe_empreendimentos`), similar ao dialog de link de projetos em `ConstutoraImobiliarias.tsx`
- **Badge no card**: mostrar quantidade de empreendimentos vinculados (ex: "3 empreendimentos")

### 3. Fluxo do usuário

1. No card de uma equipe, clica no ícone de prédio (Building)
2. Abre dialog com lista de empreendimentos da construtora
3. Marca/desmarca checkboxes para vincular/desvincular
4. Cada toggle é salvo imediatamente (insert/delete)

## Detalhes técnicos

- Arquivo principal: `src/pages/construtora/ConstutoraEquipes.tsx`
- 1 migração SQL (nova tabela + RLS)
- Padrão visual idêntico ao usado em `ConstutoraImobiliarias.tsx` para vincular projetos a parceiras

