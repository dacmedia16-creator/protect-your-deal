

## Plano: Página de Pesquisas Pós-Visita para Construtora

### Problema
A construtora não consegue ver as pesquisas pós-visita dos corretores de imobiliárias parceiras. A tabela `surveys` não tem `construtora_id` e não há RLS para `construtora_admin`. Também não existe rota `/construtora/pesquisas`.

### Solução

#### 1. Migração: adicionar `construtora_id` à tabela `surveys` + RLS

```sql
-- Adicionar coluna construtora_id
ALTER TABLE public.surveys ADD COLUMN construtora_id uuid REFERENCES public.construtoras(id);

-- Criar índice
CREATE INDEX idx_surveys_construtora_id ON public.surveys(construtora_id);

-- Popular surveys existentes com construtora_id das fichas
UPDATE public.surveys s
SET construtora_id = fv.construtora_id
FROM public.fichas_visita fv
WHERE s.ficha_id = fv.id AND fv.construtora_id IS NOT NULL;

-- RLS: construtora admin pode ver surveys da sua construtora
CREATE POLICY "Construtora admin pode ver surveys"
  ON public.surveys FOR SELECT TO authenticated
  USING (construtora_id IS NOT NULL AND is_construtora_admin(auth.uid(), construtora_id));

-- RLS: survey_responses via surveys.construtora_id
CREATE POLICY "Construtora admin pode ver respostas"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM surveys s
    WHERE s.id = survey_responses.survey_id
    AND s.construtora_id IS NOT NULL
    AND is_construtora_admin(auth.uid(), s.construtora_id)
  ));
```

#### 2. Atualizar Edge Function `create-survey`
Ao criar a survey, também preencher `construtora_id` a partir da ficha:
```typescript
construtora_id: ficha.construtora_id || null,
```
(A ficha já é consultada e tem `construtora_id` se vinculada a construtora.)

Será necessário buscar `construtora_id` na query da ficha existente.

#### 3. Criar página `src/pages/construtora/ConstutoraPesquisas.tsx`
Clonar a estrutura de `EmpresaPesquisas.tsx`, adaptando:
- Usar `ConstutoraLayout` em vez de `ImobiliariaLayout`
- Filtrar por `construtora_id` em vez de `imobiliaria_id`
- Usar `construtora?.nome` para exports
- Incluir nome do corretor e imobiliária parceira na listagem (via join com `fichas_visita` + `profiles`)
- Manter chart de médias, stats, filtros, dialog de resposta, export PDF/Excel e delete

#### 4. Adicionar rota em `App.tsx`
```typescript
<Route path="/construtora/pesquisas" element={
  <ProtectedRoute allowedRoles={['construtora_admin']}>
    <ConstutoraPesquisas />
  </ProtectedRoute>
} />
```

#### 5. Adicionar link no menu lateral (`ConstutoraLayout.tsx`)
Adicionar item `{ href: '/construtora/pesquisas', icon: ClipboardCheck, label: 'Pesquisas' }` após "Registros de Visita".

### Detalhes técnicos
- A query de surveys para construtora usará `.eq('construtora_id', construtoraId)` com join em `fichas_visita` para obter endereço e protocolo
- O nome do corretor virá de uma RPC ou será resolvido via `fichas_visita.user_id` + profiles (usando a mesma strategy SECURITY DEFINER se necessário)
- Surveys futuras serão automaticamente associadas à construtora via a alteração no edge function

