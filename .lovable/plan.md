

## Adicionar opção "Primeira Mensalidade" no sistema de indicação

### Contexto
Atualmente a comissão de indicação é sempre um percentual (%) sobre o primeiro pagamento. O admin quer poder escolher entre dois modos: percentual OU valor integral da primeira mensalidade.

### Mudanças

#### 1. Banco de dados (migration)
- Adicionar coluna `tipo_comissao_indicacao` (text, default `'percentual'`) na tabela `indicacoes_corretor` — valores: `'percentual'` ou `'primeira_mensalidade'`
- Adicionar config `indicacao_tipo_comissao` na `configuracoes_sistema` com valor default `'percentual'`

#### 2. Admin Configurações (`AdminConfiguracoes.tsx`)
- Adicionar um Select acima dos inputs de % com opções:
  - "Percentual (%)" — mostra os inputs de %
  - "Primeira mensalidade (100%)" — esconde os inputs de %
- Salvar na chave `indicacao_tipo_comissao`

#### 3. Edge Function `gerar-codigo-indicacao`
- Ler config `indicacao_tipo_comissao` e salvar o tipo na coluna `tipo_comissao_indicacao` do registro criado
- Se tipo for `primeira_mensalidade`, setar `comissao_percentual = 100`

#### 4. Webhook `asaas-webhook` (cálculo da comissão)
- No bloco de referral commission, verificar `tipo_comissao_indicacao`:
  - Se `percentual`: calcular como hoje (`value * comissao_percentual / 100`)
  - Se `primeira_mensalidade`: `valor_comissao = value` (100% do pagamento)

#### 5. Página MinhasIndicacoes
- Mostrar badge com o tipo de comissão (% ou 1ª mensalidade)

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| **Migration** | Adicionar coluna `tipo_comissao_indicacao` + config |
| `src/pages/admin/AdminConfiguracoes.tsx` | Select para tipo de comissão + lógica condicional |
| `supabase/functions/gerar-codigo-indicacao/index.ts` | Ler e salvar tipo de comissão |
| `supabase/functions/asaas-webhook/index.ts` | Calcular comissão conforme tipo |
| `src/pages/MinhasIndicacoes.tsx` | Exibir tipo de comissão |

