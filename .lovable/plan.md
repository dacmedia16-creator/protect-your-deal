

## Plano: Implementar Relatórios Reais para Construtora

### Objetivo
Substituir o placeholder em `ConstutoraRelatorios.tsx` por uma dashboard com KPIs, gráficos e tabela, mostrando fichas agrupadas por empreendimento e por imobiliária parceira.

### Dados disponíveis
- `fichas_visita` tem `construtora_id`, `empreendimento_id`, `imobiliaria_id`, `status`, `convertido_venda`, `valor_venda`, `created_at`
- `empreendimentos` tem `nome`, `construtora_id`
- `construtora_imobiliarias` + `imobiliarias` para nomes das parceiras
- RLS policy "Construtora admin pode ver fichas dos seus empreendimentos" already exists

### Estrutura da página

**1. Filtros** - Data início/fim (default 6 meses), status

**2. KPI Cards** (grid 4 colunas)
- Total de Registros
- Confirmados
- Taxa de Confirmação (%)
- Vendas Registradas

**3. Gráfico de barras - Registros por Mês** (6 meses, total vs confirmadas)

**4. Gráfico de barras horizontal - Por Empreendimento** (total fichas por empreendimento)

**5. Gráfico de barras horizontal - Por Imobiliária Parceira** (total fichas por imobiliária)

**6. Tabela detalhada** - Registros com protocolo, empreendimento, imobiliária, data, status

### Alterações

**1 arquivo modificado:** `src/pages/construtora/ConstutoraRelatorios.tsx`

- Fetch `fichas_visita` where `construtora_id` matches, with date/status filters
- Fetch `empreendimentos` for name mapping
- Fetch `construtora_imobiliarias` + `imobiliarias` for partner name mapping
- Compute KPIs via `useMemo`
- Compute monthly data, per-empreendimento data, per-imobiliaria data
- Render using same patterns as `EmpresaRelatorios.tsx`: recharts `BarChart`, shadcn Cards/Table
- Add CSV export button

### Sem alterações no banco de dados
Todas as tabelas e RLS policies necessárias já existem.

