

# Diagnóstico: Segurança do Supabase Realtime

## Descoberta Crítica

**O risco identificado pelo scanner de segurança é um falso positivo para este projeto.**

O Supabase Realtime tem dois mecanismos separados:

1. **Postgres Changes** (o que este projeto usa) — filtra eventos automaticamente pelas **políticas RLS existentes da tabela fonte**. Cada cliente só recebe eventos de linhas que suas RLS policies permitem ver via SELECT.

2. **Broadcast & Presence** (o que `realtime.messages` RLS controla) — este projeto **não usa** Broadcast nem Presence.

### Como funciona o filtro atual

Quando um cliente se inscreve em `postgres_changes` na tabela `fichas_visita`:
- O servidor Realtime captura o evento do WAL
- Para cada cliente inscrito, executa internamente uma query SELECT com o JWT do cliente
- Se a RLS policy do cliente permite ver aquela linha, o evento é entregue
- Se não permite, o evento é descartado silenciosamente

### Prova no código

Todos os 5 pontos de uso de Realtime no projeto usam exclusivamente `postgres_changes`:

| Hook/Componente | Canal | Tabela | Filtro adicional |
|---|---|---|---|
| `useFichaNotification` | `fichas-confirmadas-notification` | `fichas_visita` | `imobiliaria_id=eq.X` ou `user_id=eq.X` |
| `useAssinaturaNotification` | `assinatura-status-changes` | `assinaturas` | `imobiliaria_id=eq.X` / `construtora_id=eq.X` / `user_id=eq.X` |
| `useConvitesPendentes` | `convites-realtime-{userId}` | `convites_parceiro` | `corretor_parceiro_id=eq.X` |
| `DetalhesFicha` | `ficha-otp-{id}` | `fichas_visita` | `id=eq.X` |
| `SuperAdminLayout` | `admin-notifications` | `assinaturas`, `user_roles`, `convites` | nenhum (super_admin tem RLS `is_super_admin()`) |

### Análise de segurança por tabela

- **`fichas_visita`**: RLS tem 6 policies de SELECT (owner, parceiro, admin imobiliária, construtora, líder equipe, super_admin). Um corretor nunca recebe eventos de fichas de outro tenant.
- **`assinaturas`**: RLS tem 4 policies de SELECT (imobiliária, construtora, user, super_admin). Isolamento por tenant garantido.
- **`convites_parceiro`**: RLS tem 3 policies de SELECT (origem, parceiro por ID, parceiro por telefone, super_admin). Isolamento por usuário garantido.

## Conclusão

**Nenhuma mudança é necessária.** Criar RLS em `realtime.messages` e migrar para canais `private: true` não teria efeito nenhum porque o projeto não usa Broadcast nem Presence. As RLS policies existentes nas tabelas fonte JÁ protegem os eventos de `postgres_changes`.

### Única recomendação menor (opcional)

O canal `admin-notifications` no `SuperAdminLayout` escuta `assinaturas` e `user_roles` sem filtro de coluna. Isso é seguro porque a RLS de `assinaturas` e `user_roles` para super_admin exige `is_super_admin(auth.uid())` — um corretor comum nunca receberia esses eventos. Não é necessário alterar.

## Ação sugerida

Marcar o finding `MISSING_REALTIME_CHANNEL_AUTHORIZATION` como **ignorado/falso positivo** no painel de segurança, documentando que o projeto usa exclusivamente `postgres_changes` (protegido por RLS das tabelas fonte) e não usa Broadcast/Presence.

