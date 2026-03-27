

## Plano: Registro via Construtoras Parceiras para Corretores de Imobiliária

### Problema
Corretores de imobiliárias que são parceiras de construtoras não têm acesso ao fluxo de criação de fichas com empreendimentos. Eles precisam poder selecionar uma construtora parceira e criar fichas com o mesmo fluxo da construtora (empreendimento + proprietário automático).

### Solução

#### 1. Dashboard — Novo card "Registro Construtoras" (`src/pages/Dashboard.tsx`)
- Adicionar query para buscar `construtora_imobiliarias` com status `ativa` filtrado pelo `imobiliariaId`
- Se houver parcerias ativas, mostrar um card "Registro Construtoras" na seção de ações rápidas (desktop e mobile)
- Ao clicar, navegar para `/fichas/nova?modo=construtora`

#### 2. NovaFicha — Modo construtora parceira (`src/pages/NovaFicha.tsx`)
- Detectar `?modo=construtora` nos query params quando o corretor é de uma imobiliária
- Adicionar query para buscar construtoras parceiras ativas (`construtora_imobiliarias` → `construtoras`)
- Adicionar estado `selectedConstrutoraId` para a construtora selecionada
- Quando `modo=construtora`:
  - Mostrar Select de construtoras parceiras no topo
  - Ao selecionar construtora, buscar empreendimentos liberados para a imobiliária (via `empreendimento_imobiliarias` filtrado por `imobiliaria_id`)
  - Mostrar Select de empreendimentos (como já existe para construtoras nativas)
  - Forçar modo `comprador` (proprietário = construtora selecionada)
  - No submit: preencher `proprietario_nome/cpf/telefone` com dados da construtora, marcar `proprietario_confirmado_em`, definir `construtora_id` e `empreendimento_id`

#### 3. RLS — Empreendimentos visíveis para imobiliárias parceiras
- Já existe a policy `Imobiliaria parceira pode ver empreendimentos` que usa `empreendimento_imobiliarias`
- Verificar se a policy de INSERT em `fichas_visita` permite `construtora_id` quando o corretor é de imobiliária (atualmente a policy verifica `imobiliaria_id` — precisa permitir `construtora_id` não-nulo junto com `imobiliaria_id`)

#### 4. Migração SQL
- Atualizar a policy de INSERT em `fichas_visita` para permitir que corretores de imobiliária insiram fichas com `construtora_id` preenchido (desde que a construtora seja parceira ativa da imobiliária)

### Arquivos afetados
- `src/pages/Dashboard.tsx` — card "Registro Construtoras"
- `src/pages/NovaFicha.tsx` — fluxo de seleção construtora + empreendimento para corretores de imobiliária
- 1 migração SQL — ajustar RLS de INSERT em `fichas_visita`

### Fluxo resumido
```text
Corretor de imobiliária parceira clica "Registro Construtoras"
       ↓
Navega para /fichas/nova?modo=construtora
       ↓
Seleciona construtora parceira → carrega empreendimentos liberados
       ↓
Seleciona empreendimento → preenche endereço/tipo
       ↓
Preenche dados do comprador + data da visita
       ↓
INSERT: construtora_id, empreendimento_id, proprietário = construtora
       ↓
Status: aguardando_comprador → OTP apenas para comprador
```

