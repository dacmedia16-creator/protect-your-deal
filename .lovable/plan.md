

## Resultado do Teste — Problemas Encontrados

### O que funciona
- **Admin Dashboard**: KPI card "Construtoras" aparece corretamente (mostra 0)
- **Admin Construtoras**: Página de listagem funciona, busca funciona, botão "Nova Construtora" presente
- **Sidebar**: Link "Construtoras" no menu lateral visível e funcional
- **Edge Function**: `registro-construtora` existe e a lógica está completa
- **Painel Construtora**: Código do dashboard, empreendimentos, etc. está implementado

### Problemas encontrados

**1. Página "Nova Construtora" renderiza em branco** (BUG CRÍTICO)
- Ao clicar "Nova Construtora" ou acessar `/admin/construtoras/nova`, a página fica completamente em branco
- Não há erro de crash no console, apenas warnings de `forwardRef`
- Provável causa: o componente `AdminNovaConstrutora` está sendo montado mas o `SuperAdminLayout` ou o formulário não renderiza visualmente (possível problema de CSS/layout ou o `ProtectedRoute` fica preso no loading state)

**2. Página de registro self-service não existe** (FUNCIONALIDADE FALTANDO)
- A rota `/registro-construtora` faz `<Navigate to="/registro-tipo" replace />`
- Não existe `RegistroConstrutora.tsx` — a página de cadastro público para construtoras nunca foi criada
- O card "Construtora" em `RegistroTipo.tsx` aponta para `/registro-construtora` mas vai voltar para a mesma página
- A edge function `registro-construtora` está pronta mas não tem frontend que a invoque

**3. Detalhes Construtora não testada**
- Não foi possível testar `/admin/construtoras/:id` pois não há construtoras cadastradas (a criação falha no ponto 1)

### Plano de correção

**Correção 1: Investigar e corrigir página em branco `AdminNovaConstrutora`**
- Verificar se há algum import quebrado ou TypeScript error silencioso
- Testar renderização isolada do componente

**Correção 2: Criar `src/pages/auth/RegistroConstrutora.tsx`**
- Formulário público com dados da construtora + dados do admin (nome, email, senha)
- Seletor de plano (filtrando planos com `tipo_cadastro = 'construtora'`)
- Campos opcionais: cupom e código de indicação
- Chama `supabase.functions.invoke('registro-construtora')` ao submeter
- Após sucesso, redireciona para login com mensagem de sucesso
- Baseado no padrão de `RegistroImobiliaria.tsx`

**Correção 3: Atualizar rota em `App.tsx`**
- Trocar `<Navigate to="/registro-tipo" replace />` pela nova página `<RegistroConstrutora />`

### Detalhes técnicos

**RegistroConstrutora.tsx** terá:
- Formulário em 2 seções: "Dados da Construtora" (nome, CNPJ, email, telefone, endereço) e "Dados do Administrador" (nome, email, senha)
- Validação Zod: email válido, senha mín. 6 chars, nome obrigatório
- Query param `plano` para pré-selecionar plano
- Query params `ref` (indicação) e `aff` (cupom) para rastrear origem
- Chamada à edge function `registro-construtora` com payload completo

