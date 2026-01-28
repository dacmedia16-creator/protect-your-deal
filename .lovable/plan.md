

# Remover Usuário de Teste

## Usuário Identificado

| Campo | Valor |
|-------|-------|
| **ID** | `5e4fc831-e5c9-421d-ae23-69d2ef8fa10b` |
| **Email** | `testuser9999@test.com` |
| **Nome** | Test User |
| **Role** | corretor |
| **Criado em** | 28/01/2026 22:04 |

## Dados Associados

- ✅ `profiles`: 1 registro (será deletado em cascata)
- ✅ `user_roles`: 1 registro (será deletado em cascata)
- ✅ `equipes_membros`: 0 registros
- ✅ `fichas_visita`: 0 registros
- ✅ `otp_queue`: 0 registros

Nenhum dado de negócio será perdido.

## Ação

Deletar o usuário diretamente da tabela `auth.users`. As foreign keys com `ON DELETE CASCADE` cuidarão automaticamente de:
- Remover o registro em `profiles`
- Remover o registro em `user_roles`

## Comando SQL

```sql
DELETE FROM auth.users WHERE id = '5e4fc831-e5c9-421d-ae23-69d2ef8fa10b';
```

## Resultado Esperado

O usuário de teste será completamente removido do sistema, liberando o email `testuser9999@test.com` para uso futuro se necessário.

