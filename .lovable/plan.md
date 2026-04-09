

# Plano: Gestão Comercial de Visitas — Painel Construtora

## 1. O que existe hoje

| Tela | O que faz |
|------|-----------|
| `ConstrutoraDashboard` | 4 KPI cards (corretores, fichas/mês, empreendimentos, código), gráfico 6 meses, ações rápidas, assinatura |
| `ConstutoraRelatorios` | Filtros período + status, 4 KPIs (total, confirmados, taxa, vendas), evolução mensal, fichas por empreendimento, fichas por imobiliária, tabela detalhada, export CSV |
| `ConstutoraFichas` | Lista de fichas com busca e filtro por imobiliária, status badges, delete |
| `ConstutoraCorretores` | Lista com KPIs, CRUD, equipes |

## 2. O que pode ser melhorado sem mudar o fluxo do corretor

### Dashboard (`ConstrutoraDashboard`)
- Adicionar cards executivos: fichas pendentes, confirmadas, taxa de confirmação, vendas no mês, valor vendido
- Comparativos visuais com período anterior (setas alta/queda com %)
- Alertas gerenciais: fichas pendentes há mais de X dias, queda de performance MoM
- Ações rápidas contextuais: link direto para fichas pendentes, fichas com venda

### Relatórios (`ConstutoraRelatorios`)
- Adicionar filtros por empreendimento, imobiliária parceira e corretor
- KPIs com comparativo período anterior
- Ranking de corretores por volume e conversão
- Ranking de imobiliárias parceiras
- Conversão por empreendimento (fichas -> confirmadas -> vendas)
- Valor vendido e ticket médio

### Fichas (`ConstutoraFichas`)
- Adicionar filtros por status, empreendimento, período
- Contadores rápidos no topo (total, pendentes, confirmadas, vendas)

## 3. Relatórios implementáveis agora (com dados existentes)

| Relatório | Campos disponíveis |
|-----------|-------------------|
| Funil de visitas (criadas -> confirmadas -> vendas) | `status`, `convertido_venda` |
| Conversão por corretor | `user_id` + join `profiles` (via RPC) |
| Conversão por empreendimento | `empreendimento_id` |
| Conversão por imobiliária/parceiro | `imobiliaria_id` |
| Valor vendido e ticket médio | `valor_venda`, `convertido_venda` |
| Ranking de parceiros | Agrupamento por `imobiliaria_id` |
| Produtividade por corretor | Contagem fichas por `user_id` |
| Tendências de performance | Série temporal por `created_at` |

## 4. Relatórios que dependem de novos dados

| Relatório | Campo necessário | Tabela |
|-----------|-----------------|--------|
| No-show (visita agendada sem comparecimento) | `compareceu` (boolean) ou status `no_show` | `fichas_visita` |
| Motivos de perda | `motivo_perda` (text) | `fichas_visita` |
| Tempo médio entre etapas | Timestamps por etapa (`enviado_em`, `confirmado_em`, etc.) | `fichas_visita` — já possui `proprietario_confirmado_em`, `comprador_confirmado_em`, `created_at` |
| Origem da visita | `origem` (enum/text) | `fichas_visita` |

**Nota**: tempo médio entre criação e confirmação já é calculável com os campos existentes (`created_at`, `proprietario_confirmado_em`, `comprador_confirmado_em`).

## 5. Plano de implementação por fases

### Fase 1 — Dashboard Executivo (implementar agora)
Melhorar `ConstrutoraDashboard` com:
- 6 KPI cards: fichas criadas, confirmadas, pendentes, taxa de confirmação, vendas, valor vendido
- Comparativo com mês anterior (setas + %)
- Card de alertas gerenciais (fichas pendentes, queda de performance)
- Gráfico mensal empilhado (total vs confirmados vs vendas)

### Fase 2 — Filtros avançados no Relatórios
- Filtros por empreendimento, imobiliária, corretor
- KPIs com comparativo período anterior
- Funil visual (criadas → confirmadas → vendas)

### Fase 3 — Rankings e conversão
- Ranking de corretores (volume, confirmação, vendas)
- Ranking de imobiliárias parceiras
- Conversão por empreendimento
- Ticket médio e valor vendido

### Fase 4 — Novos campos + relatórios avançados
- Migração para adicionar `motivo_perda` e status `no_show`
- Relatório de no-show
- Relatório de motivos de perda
- Tempo médio entre etapas

## 6. Detalhes da Fase 1 (será implementada)

### Arquivo: `src/pages/construtora/ConstrutoraDashboard.tsx`

**Mudanças**:
1. Expandir `DashboardStats` com: `fichasConfirmadas`, `fichasPendentes`, `vendasMes`, `valorVendidoMes`, `fichasMesAnteriorConfirmadas`, `vendasMesAnterior`, `valorVendidoMesAnterior`
2. Buscar fichas do mês com `select('status, convertido_venda, valor_venda')` em vez de `head: true` para poder calcular os KPIs detalhados, e o mesmo para o mês anterior
3. Renderizar 6 cards em grid 2x3 mobile / 3x2 desktop com indicadores de variação
4. Card de alertas: fichas pendentes há mais de 48h (query com `status = 'pendente'` e `created_at < now - 48h`), queda MoM > 20%
5. Gráfico mensal com barras empilhadas (total, confirmados, vendas)
6. Manter estrutura existente de ações rápidas e assinatura

**Não muda**: nenhuma rota, nenhum componente do corretor, nenhuma tabela do banco.

Todas as queries usam dados já existentes em `fichas_visita`. Nenhuma migração necessária para a Fase 1.

