

## Plano Anual — Melhor abordagem para o sistema atual

### Situação atual

A tabela `planos` tem uma coluna `valor_mensal` e nenhuma coluna de periodicidade. Todas as referências no código (edge functions, páginas de assinatura, admin) assumem cobrança mensal. O Asaas suporta `subscriptionCycle: 'YEARLY'` nativamente.

### Abordagem recomendada: Adicionar colunas de periodicidade à tabela `planos`

Em vez de duplicar cada plano (um mensal, um anual), a melhor forma é adicionar duas colunas na tabela `planos`:

```text
periodicidade  TEXT  DEFAULT 'mensal'   -- 'mensal' ou 'anual'
valor_anual    NUMERIC DEFAULT NULL     -- preço anual (ex: 10x em vez de 12x)
```

Assim cada plano pode ter **ambos os preços** e o usuário escolhe na hora de assinar. Não duplica dados de limites.

### Alterações necessárias

**1. Migração do banco de dados**
- Adicionar `valor_anual NUMERIC DEFAULT NULL` e `periodicidade TEXT DEFAULT 'mensal'` à tabela `planos`
- A coluna `periodicidade` será usada apenas como filtro/display; o ciclo real fica na assinatura

**2. Tabela `assinaturas`** — adicionar coluna
- `ciclo TEXT DEFAULT 'mensal'` — para saber se a assinatura ativa é mensal ou anual

**3. Admin de Planos (`AdminPlanos.tsx`)**
- Adicionar campo `valor_anual` no formulário de criação/edição de planos

**4. Páginas de Assinatura (`EmpresaAssinatura.tsx` e `CorretorAssinatura.tsx`)**
- Adicionar toggle "Mensal / Anual" no topo da seção de planos
- Mostrar preço mensal ou anual conforme seleção, com badge de desconto (ex: "Economize 17%")
- Passar o ciclo escolhido para a edge function

**5. Edge Function `asaas-payment-link`**
- Receber parâmetro `ciclo` ('mensal' ou 'anual')
- Usar `valor_anual` quando ciclo for anual
- Enviar `subscriptionCycle: 'YEARLY'` ao Asaas

**6. Edge Function `asaas-create-subscription`**
- Mesmo ajuste: usar `cycle: 'YEARLY'` e `valor_anual` quando aplicável

**7. Edge Function `asaas-webhook`**
- Salvar o `ciclo` na assinatura ao confirmar pagamento

**8. Páginas de registro (`RegistroImobiliaria.tsx`, `RegistroCorretorAutonomo.tsx`)**
- Adicionar toggle mensal/anual na seleção de plano (se `valor_anual` existir)

**9. Landing page (`Index.tsx`) — seção de preços**
- Adicionar toggle mensal/anual nos cards de preço

### Arquivos a alterar
- Migração SQL (nova)
- `supabase/functions/asaas-payment-link/index.ts`
- `supabase/functions/asaas-create-subscription/index.ts`
- `supabase/functions/asaas-webhook/index.ts`
- `src/pages/admin/AdminPlanos.tsx`
- `src/pages/empresa/EmpresaAssinatura.tsx`
- `src/pages/CorretorAssinatura.tsx`
- `src/pages/auth/RegistroImobiliaria.tsx`
- `src/pages/auth/RegistroCorretorAutonomo.tsx`
- `src/pages/Index.tsx`

