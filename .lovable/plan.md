

# Nova Página: Envio de WhatsApp para Usuários (Super Admin)

## O que será criado

Uma página dedicada no painel Super Admin para enviar mensagens WhatsApp de texto livre para usuários do sistema, usando o canal padrão (default).

## Implementação

### 1. Criar página `src/pages/admin/AdminWhatsApp.tsx`

- Lista todos os usuários com telefone cadastrado (query em `profiles` + `user_roles`)
- Filtros: por role, por imobiliária, por nome/telefone
- Seleção múltipla de destinatários (checkboxes) + "selecionar todos filtrados"
- Campo de textarea para digitar a mensagem personalizada
- Variáveis dinâmicas disponíveis: `{nome}` (substituído pelo nome do usuário)
- Botão "Enviar" que dispara `supabase.functions.invoke('send-whatsapp', { action: 'send-text', phone, message })` para cada selecionado
- Progresso visual do envio (X de Y enviados, sucessos/falhas)
- Histórico não será persistido (envio direto)

### 2. Adicionar rota no `src/App.tsx`

- Rota `/admin/whatsapp` protegida com `allowedRoles={['super_admin']}`

### 3. Adicionar link no menu do SuperAdminLayout

- Item "WhatsApp" com ícone `MessageCircle` no grupo "Sistema"

### 4. Corrigir bug existente no envio

- O `handleSendWhatsApp` em `AdminUsuarios.tsx` usa `to` em vez de `phone` no body. Será corrigido para consistência.

## Detalhes Técnicos

- O envio usa o canal `default` (não especifica `channel`, então a edge function usa o padrão do banco)
- Envio sequencial com delay de 500ms entre mensagens para evitar rate limiting
- A edge function `send-whatsapp` já tem `verify_jwt = true`, então precisa do token de autenticação

