

## Corrigir leitura de configuração de comissão para corretores

### Problema

A tabela `configuracoes_sistema` tem RLS restrito a `super_admin`. Quando um corretor acessa "Minhas Indicações", a query `configuracoes_sistema` retorna vazio e o código usa os defaults (`percentual`, `10%`), ignorando a configuração real.

### Solução

Buscar a configuração de comissão via a edge function `gerar-codigo-indicacao` que já usa `service_role` e já retorna/sincroniza os valores atuais. Em vez de fazer query direta na tabela, chamar a edge function (que já existe e já trata esse cenário).

Alternativa mais simples: criar uma policy RLS para permitir leitura das chaves de indicação por usuários autenticados.

**Abordagem escolhida**: Adicionar uma RLS policy `SELECT` em `configuracoes_sistema` para `authenticated` que permita ler apenas as chaves de indicação. Isso é mais limpo e não exige chamada extra à edge function.

| O quê | Como |
|-------|------|
| Migration SQL | `CREATE POLICY "Authenticated pode ler config indicacao" ON configuracoes_sistema FOR SELECT TO authenticated USING (chave IN ('indicacao_tipo_comissao', 'indicacao_comissao_corretor'))` |

Nenhuma mudança no frontend — o código já faz a query correta, só precisa de permissão para ler.

