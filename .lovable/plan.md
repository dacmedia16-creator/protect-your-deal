

## Plano: Corrigir acesso ao perfil para construtora_admin

### Problema
A rota `/perfil` em `App.tsx` (linha 512) define `allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin']}`, excluindo `construtora_admin`. Quando um usuário de construtora tenta acessar o perfil, o `ProtectedRoute` bloqueia e redireciona.

### Correção

**1. Adicionar `construtora_admin` às roles permitidas em `App.tsx`**

Linha 512: mudar de:
```typescript
allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin']}
```
para:
```typescript
allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin', 'construtora_admin']}
```

Alteração de 1 linha em 1 arquivo.

