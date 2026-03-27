

## Auditoria: Diferenças entre módulos Construtora e Imobiliária

Após comparação detalhada de todas as páginas equivalentes, encontrei as seguintes diferenças significativas:

---

### 1. Dashboard — Faltam hooks de notificação na Construtora

**Imobiliária** (`EmpresaDashboard.tsx`) usa:
- `useFichaNotification()` — notificação de fichas confirmadas
- `useAssinaturaNotification()` — notificação de mudanças na assinatura
- `useImobiliariaFeatureFlag('post_visit_survey')` — card de pesquisas

**Construtora** (`ConstrutoraDashboard.tsx`): Nenhum desses hooks. Não recebe notificações em tempo real e não exibe card de pesquisas.

**Correção**: Adicionar os 3 hooks ao dashboard da construtora.

---

### 2. Corretores — Funcionalidades ausentes na Construtora

**Imobiliária** (`EmpresaCorretores.tsx`, 1285 linhas) tem:
- Convites por email (enviar/cancelar)
- Mover corretor entre equipes
- Promover corretor a admin
- Excluir corretor permanentemente (`empresa-delete-corretor`)
- Filtro por equipe
- Link para detalhes do corretor (`/empresa/corretores/:userId`)
- Detecção de URL `?highlight=` para abrir modal automaticamente
- Exibe badge de equipe e cargo (admin/líder/corretor)

**Construtora** (`ConstutoraCorretores.tsx`, 548 linhas) **não tem**:
- Convites por email
- Mover entre equipes
- Promover a admin
- Excluir corretor
- Filtro por equipe
- Badge de equipe na listagem

**Correção**: Adicionar as funcionalidades faltantes na página de corretores da construtora.

---

### 3. Detalhes do Corretor — Muito mais simples na Construtora

**Imobiliária** (`EmpresaDetalhesCorretor.tsx`, 598 linhas):
- Mostra role (admin/corretor) com `RoleBadge`
- Tab de Pesquisas (se feature habilitada)
- Métricas de pesquisas (satisfação, médias por critério)
- KPIs: 5 cards (Registros, Taxa, Pesquisas, Satisfação, Confirmados)

**Construtora** (`ConstutoraDetalhesCorretor.tsx`, 287 linhas):
- Não mostra role dinâmico (hardcoded "corretor")
- Sem tab de pesquisas
- KPIs: apenas 3 cards
- Não filtra profile por `construtora_id` (possível bug de segurança — um profile de outra org poderia ser acessado)

**Correção**: Alinhar detalhes do corretor com a versão da imobiliária.

---

### 4. Fichas — Faltam funcionalidades na Construtora

**Imobiliária** (`EmpresaFichas.tsx`):
- Usa `useFichaNotification()` para notificações
- Usa RPC `get_fichas_empresa` para buscar fichas (otimizado)
- Tem `DeleteFichaDialog` para excluir fichas

**Construtora** (`ConstutoraFichas.tsx`):
- Sem hook de notificação
- Query direta (não usa RPC)
- **Não permite excluir fichas**
- Fichas são read-only (sem `DeleteFichaDialog`)

**Correção**: Adicionar notificação e opção de exclusão de fichas.

---

### 5. Assinatura — Toast simplificado na Construtora

**Imobiliária** (`EmpresaAssinatura.tsx`):
- Usa `useAssinaturaNotification()` 
- Toast de erro com botão "Tentar novamente" e duração de 10s
- Mensagem detalhada no toast de sucesso

**Construtora** (`ConstutoraAssinatura.tsx`):
- Sem hook de notificação de assinatura
- Toast de erro simplificado, sem retry

**Correção**: Alinhar UX do toast e adicionar hook de notificação.

---

### 6. Configurações — Falta CRECI jurídico na Construtora

**Imobiliária** (`EmpresaConfiguracoes.tsx`, 664 linhas):
- Campo `creci_juridico` no formulário
- Mais tabs e opções

**Construtora** (`ConstutoraConfiguracoes.tsx`, 315 linhas):
- Sem campo `creci_juridico` (pode não se aplicar, mas deveria ter se relevante)
- Menos tabs

**Observação**: CRECI jurídico pode não se aplicar a construtoras, então essa diferença pode ser intencional.

---

### 7. Relatórios — Implementações divergentes

**Imobiliária** (`EmpresaRelatorios.tsx`, 933 linhas):
- Pesquisas de satisfação integradas (se feature habilitada)
- Ranking de corretores com métricas de survey
- KPIs incluem vendas e satisfação
- Filtro por corretor específico

**Construtora** (`ConstutoraRelatorios.tsx`, 458 linhas):
- Sem integração com pesquisas
- Sem ranking de corretores
- Tem gráficos por empreendimento e por imobiliária parceira (exclusivos)

**Observação**: Parte das diferenças é intencional (empreendimentos/parcerias), mas falta o ranking de corretores.

---

### Resumo das Correções Necessárias

| Prioridade | Página | O que falta |
|-----------|--------|-------------|
| Alta | Dashboard Construtora | Hooks de notificação (fichas + assinatura) |
| Alta | Corretores Construtora | Convites, mover equipe, excluir, filtro equipe |
| Alta | Detalhes Corretor Construtora | Role dinâmico, mais KPIs, filtro seguro por org |
| Média | Fichas Construtora | Notificação, exclusão de fichas |
| Média | Assinatura Construtora | Hook de notificação, toast com retry |
| Baixa | Relatórios Construtora | Ranking de corretores |

Deseja que eu implemente todas as correções ou quer priorizar algum grupo específico?

