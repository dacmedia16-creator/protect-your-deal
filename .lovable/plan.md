

## Corrigir acesso de denys@denysouza.com.br

### Diagnóstico
O usuário `6f040b6f-a2c6-4e6b-b769-f746451380f2` (denys@denysouza.com.br / Fernanda A Souza):
- Tem registro em `profiles` (ativo = true)
- Tem registro em `afiliados` (ativo = true)
- **NÃO tem registro em `user_roles`** — por isso cai na tela "Conta Pendente"

### Solução
Inserir o role `afiliado` na tabela `user_roles` via migration SQL.

### Mudança

| Arquivo | Mudança |
|---------|---------|
| Nova migration SQL | `INSERT INTO user_roles (user_id, role) VALUES ('6f040b6f-...', 'afiliado')` |

Isso resolve o problema imediatamente — o sistema vai detectar o role e redirecionar para `/afiliado`.

