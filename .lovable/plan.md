

## Plano: Remover telefone do perfil órfão

### Ação
Executar um UPDATE no banco de dados para limpar o campo `telefone` do perfil do Francisco de Souza:

```sql
UPDATE profiles 
SET telefone = NULL 
WHERE user_id = 'f2f53a2b-4256-43a4-8e94-cdb7218e9362';
```

Isso vai liberar o número `15981788214` para ser usado em outro usuário.

### Execução
Será feito via chamada à Edge Function `admin-update-user` com o campo telefone vazio, ou diretamente via migration tool para executar o UPDATE.

