
# Plano: Restringir Acesso de Email ao Super Admin

## Contexto

O email `noreply@visitaprova.com.br` é usado exclusivamente pelo sistema VisitaProva para enviar notificações automáticas. Imobiliárias e corretores são **destinatários** desses emails, não remetentes.

## Mudanças Necessárias

### 1. Atualizar Rotas no App.tsx

Alterar as rotas de email para permitir **apenas** `super_admin`:

| Rota | Roles Atual | Roles Correto |
|------|-------------|---------------|
| `/integracoes/email` | `imobiliaria_admin` | `super_admin` |
| `/integracoes/email/historico` | `imobiliaria_admin` | `super_admin` |

**Nota:** As rotas `/integracoes` e `/integracoes/templates` continuam para `imobiliaria_admin` pois são para templates de WhatsApp, que é uma funcionalidade do cliente.

### 2. Mover Menu de Email para Área Admin

As páginas de email devem estar no painel do Super Admin (`/admin/email`), não em `/integracoes`.

**Novas rotas:**
- `/admin/email` - Configurações e teste de conexão SMTP
- `/admin/email/historico` - Histórico de todos os emails enviados
- `/admin/email/templates` - Gerenciar templates globais do sistema

### 3. Atualizar Políticas RLS (Opcional)

As políticas atuais já permitem que Super Admin veja tudo. Podemos remover as políticas que permitem acesso de `imobiliaria_admin` se desejar restringir completamente.

---

## Secao Tecnica

### Modificações no App.tsx

```typescript
// REMOVER estas rotas de /integracoes:
// /integracoes/email
// /integracoes/email/historico

// ADICIONAR novas rotas em /admin:
<Route path="/admin/email" element={
  <ProtectedRoute allowedRoles={['super_admin']}>
    <ConfiguracoesEmail />
  </ProtectedRoute>
} />
<Route path="/admin/email/historico" element={
  <ProtectedRoute allowedRoles={['super_admin']}>
    <HistoricoEmails />
  </ProtectedRoute>
} />
<Route path="/admin/email/templates" element={
  <ProtectedRoute allowedRoles={['super_admin']}>
    <TemplatesEmailAdmin />
  </ProtectedRoute>
} />
```

### Atualizar Página Integracoes.tsx

Remover o card do Zoho Mail da página de integrações (que é acessada por imobiliárias).

### Adicionar Link no Menu Admin

Adicionar entrada no menu do SuperAdminLayout para acesso às configurações de email:
- Ícone: Mail
- Texto: "Email Sistema"
- Link: `/admin/email`

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Mover rotas de email para `/admin/*` |
| `src/pages/Integracoes.tsx` | Remover card do Zoho Mail |
| `src/components/layouts/SuperAdminLayout.tsx` | Adicionar link para email no menu |
| `src/pages/ConfiguracoesEmail.tsx` | Atualizar título e navegação |
| `src/pages/HistoricoEmails.tsx` | Atualizar título e navegação |

---

## Resultado Final

- Super Admin acessa email em `/admin/email`
- Imobiliárias e corretores não veem nada sobre email
- Página de Integrações continua apenas com WhatsApp/APIs
