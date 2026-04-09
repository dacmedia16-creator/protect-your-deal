

# Plano: Adicionar filtro e dados por Equipe nos Relatórios da Construtora

## Resumo

Adicionar um filtro de "Equipe" nos relatórios da construtora e incluir uma seção de ranking/performance por equipe, permitindo análise segmentada.

## Etapas

### 1. Adicionar filtro de Equipe

No arquivo `src/pages/construtora/ConstutoraRelatorios.tsx`:

- Novo estado `equipeFilter` (default `'todos'`)
- Fetch das equipes da construtora via `supabase.from('equipes').select('id, nome, cor').eq('construtora_id', construtoraId).eq('ativa', true)`
- Fetch dos membros de cada equipe via `equipes_membros` para mapear `user_id → equipe_id`
- Adicionar `<Select>` de equipe nos filtros, ao lado do filtro de Corretor
- Aplicar filtro no `useMemo` das fichas filtradas: se equipe selecionada, filtrar fichas cujo `user_id` pertence aos membros daquela equipe

### 2. Seção de Ranking por Equipe

- Novo bloco abaixo do "Ranking de Corretores" com tabela mostrando: Equipe (com badge colorido), Fichas, Confirmadas, Taxa Conf., Vendas, Valor Vendido
- Agrupar fichas por equipe usando o mapa `user_id → equipe_id`
- Ordenar por total de fichas (desc)
- Usar o componente `EquipeBadge` existente para mostrar o nome/cor

### 3. Incluir equipe no CSV exportado

- Adicionar coluna "Equipe" no export CSV, resolvendo o nome da equipe via mapa de membros

## Arquivo alterado

`src/pages/construtora/ConstutoraRelatorios.tsx` — único arquivo

## Detalhes técnicos

- Reutiliza tabelas existentes (`equipes`, `equipes_membros`) sem migração
- Reutiliza componente `EquipeBadge` para visual consistente
- Mapeamento `user_id → equipe`: um corretor pode estar em múltiplas equipes; a ficha será contada em todas as equipes do corretor

