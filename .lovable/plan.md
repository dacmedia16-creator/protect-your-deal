

## Plano: Criar página AdminNovaConstrutora

Falta a página de criação de construtora pelo super admin, similar à `AdminNovaImobiliaria.tsx`.

### Alterações

**1. Nova página `src/pages/admin/AdminNovaConstrutora.tsx`**
- Formulário com: nome, CNPJ, email, telefone, endereço, cidade, estado, status
- Seletor de plano (filtrando `tipo_cadastro = 'construtora'` ou todos os planos)
- Ao salvar: insere em `construtoras`, opcionalmente cria `assinaturas` com `construtora_id`
- Baseado no padrão de `AdminNovaImobiliaria.tsx`

**2. Atualizar `src/pages/admin/AdminConstrutoras.tsx`**
- Adicionar botão "Nova Construtora" no header, navegando para `/admin/construtoras/nova`

**3. Atualizar `src/App.tsx`**
- Adicionar rota `/admin/construtoras/nova` protegida com `super_admin`
- Importar `AdminNovaConstrutora`

