

## Sincronizar exibição de comissão com configuração atual

### Problema

Quando o código de indicação é gerado, os valores de comissão (`tipo_comissao_indicacao`, `comissao_percentual`) são gravados no registro `indicacoes_corretor`. Se o admin muda a configuração depois, a página "Minhas Indicações" continua mostrando os valores antigos porque lê do registro já salvo.

### Solução

Duas mudanças complementares:

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/MinhasIndicacoes.tsx` | Buscar configuração atual de `configuracoes_sistema` e usar esses valores para exibir a comissão do placeholder ativo, em vez dos valores salvos no registro |
| `supabase/functions/gerar-codigo-indicacao/index.ts` | Ao detectar que já existe um código ativo, atualizar `tipo_comissao_indicacao` e `comissao_percentual` com os valores atuais da config antes de retornar |

### Detalhes

**MinhasIndicacoes.tsx**: Novo `useQuery` buscando `configuracoes_sistema` com chaves `indicacao_tipo_comissao` e `indicacao_comissao_corretor`. O Alert usará esses valores em vez de `placeholderAtivo.tipo_comissao_indicacao`.

**Edge Function**: No bloco `if (existing)`, antes de retornar, fazer um `update` no registro existente com os valores atuais da config (já carregados logo abaixo). Assim o registro fica sempre sincronizado.

