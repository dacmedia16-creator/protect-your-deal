

## Plano: Permitir construtora_admin acessar detalhes da ficha

### Problema
A rota `/fichas/:id` no `App.tsx` tem `allowedRoles={['corretor', 'imobiliaria_admin', 'super_admin']}` — falta `construtora_admin`. Por isso, ao clicar no ícone do olho na lista de fichas da construtora, o usuário é bloqueado.

### Solução
Adicionar `'construtora_admin'` ao array `allowedRoles` da rota `/fichas/:id` em `src/App.tsx`.

### Arquivo afetado
- `src/App.tsx` — linha 471, adicionar `'construtora_admin'` ao array de roles

