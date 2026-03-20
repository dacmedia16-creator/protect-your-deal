

## Análise do Fluxo de Indicação — Bugs Encontrados

Tracei o fluxo completo pelo código e identifiquei **2 bugs** que precisam ser corrigidos:

### Bug 1: `tipo_comissao_indicacao` não propagado no novo placeholder

Quando alguém se registra usando um código de indicação, ambas as edge functions (`registro-corretor-autonomo` e `registro-imobiliaria`) criam um **novo placeholder** para futuras indicações do mesmo usuário. Porém, esse novo placeholder **não inclui** o campo `tipo_comissao_indicacao`, fazendo com que o valor padrão (`'percentual'`) seja sempre usado, mesmo que o admin tenha configurado `'primeira_mensalidade'`.

**Arquivos afetados:**
- `supabase/functions/registro-corretor-autonomo/index.ts` (linha ~384-389)
- `supabase/functions/registro-imobiliaria/index.ts` (linha ~283-290)

**Correção:** Adicionar `tipo_comissao_indicacao` no select da indicação original e incluí-lo no insert do novo placeholder.

### Bug 2: `tipo_comissao_indicacao` não lido no select da indicação

Nos dois registros, o `select` da indicação busca apenas `id, indicador_user_id, comissao_percentual` — falta incluir `tipo_comissao_indicacao` para propagar corretamente.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/registro-corretor-autonomo/index.ts` | Adicionar `tipo_comissao_indicacao` no select (linha 362) e no insert do novo placeholder (linha 384-389) |
| `supabase/functions/registro-imobiliaria/index.ts` | Adicionar `tipo_comissao_indicacao` no select (linha 263) e no insert do novo placeholder (linha 283-290) |

### Fluxo verificado (sem bugs)
1. ✅ Corretor acessa `/minhas-indicacoes` → clica "Gerar código" → chama `gerar-codigo-indicacao` → lê config do sistema → salva `tipo_comissao_indicacao` no registro
2. ✅ Link gerado: `/registro-autonomo?ind=IND-XXXX` ou `/registro?ind=IND-XXXX`
3. ✅ Rotas existem no App.tsx
4. ✅ `RegistroCorretorAutonomo` e `RegistroImobiliaria` leem `indParam` e passam como `codigo_indicacao`
5. ✅ Edge functions processam o referral e atualizam status para `cadastrado`
6. ✅ Query em MinhasIndicacoes filtra corretamente indicações reais vs placeholders
7. ✅ Webhook Asaas calcula comissão com `valor_mensal` do plano quando tipo é `primeira_mensalidade`

