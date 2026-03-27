

## Plano: Funcionalidades completas para Imobiliárias Parceiras (Construtora)

Reescrever `src/pages/construtora/ConstutoraImobiliarias.tsx` com todas as funcionalidades sugeridas.

### Funcionalidades

**1. Convidar imobiliária por CNPJ/email**
- Dialog com campo de busca (email ou CNPJ)
- Busca na tabela `imobiliarias` via Supabase
- Insere em `construtora_imobiliarias` com status `ativa`
- Validação de duplicata

**2. Gerenciar status da parceria**
- Dropdown menu em cada card com opções: Suspender/Reativar, Remover
- Suspender: update `construtora_imobiliarias.status` → `suspensa`
- Reativar: update → `ativa`
- Remover: delete da `construtora_imobiliarias` com AlertDialog de confirmação

**3. KPIs por parceira**
- Buscar contagens de `fichas_visita` por `imobiliaria_id` + `construtora_id` (total fichas, confirmadas)
- Buscar contagem de corretores via `user_roles` por `imobiliaria_id`
- Exibir métricas no card de cada parceira

**4. Vincular empreendimentos a parceiras**
- Dialog para associar empreendimentos (checkbox list dos empreendimentos da construtora)
- Insert/delete em `empreendimento_imobiliarias`
- Exibir badges dos empreendimentos vinculados no card

**5. Contato rápido via WhatsApp**
- Botão WhatsApp no card quando a imobiliária tem telefone

**6. Busca/filtro**
- Campo de busca por nome/email
- Filtro por status (todas, ativa, suspensa)

### Detalhes Técnicos

**Arquivo editado:** `src/pages/construtora/ConstutoraImobiliarias.tsx` (reescrita completa)

**Queries adicionais:**
- `empreendimentos` da construtora (para vincular)
- `empreendimento_imobiliarias` (para mostrar vínculos)
- `fichas_visita` com count por imobiliaria_id + construtora_id
- `user_roles` com count de corretores por imobiliaria_id
- `imobiliarias` para busca na hora de convidar

**Nenhuma migração necessária** — tabelas `construtora_imobiliarias`, `empreendimento_imobiliarias` e RLS já existem com as permissões corretas para `construtora_admin`.

**Componentes UI utilizados:** Dialog, AlertDialog, DropdownMenu, Input, Badge, Button, Card, Tabs (já existentes no projeto).

