

## Plano: Adicionar total de registros (fichas) na listagem de imobiliárias do admin

### Problema
Na página Admin Imobiliárias, cada imobiliária mostra quantidade de corretores, mas não mostra o total de registros de visita (fichas).

### Solução
Adicionar uma contagem de `fichas_visita` por `imobiliaria_id` no enriquecimento de dados e exibir na tabela/cards.

### Alterações em `src/pages/admin/AdminImobiliarias.tsx`

1. **Interface `Imobiliaria`** (linha 48-65): adicionar `fichas_count?: number`

2. **`fetchImobiliarias`** (linhas 121-158): adicionar query de contagem de fichas:
   ```typescript
   const { count: fichasCount } = await supabase
     .from('fichas_visita')
     .select('*', { count: 'exact', head: true })
     .eq('imobiliaria_id', imob.id);
   ```
   E incluir `fichas_count: fichasCount || 0` no retorno.

3. **Mobile cards** (linha ~580): adicionar ícone FileText + `imob.fichas_count` ao lado do contador de corretores.

4. **Desktop table** (linhas 596-665): adicionar coluna "Registros" no header e célula com ícone FileText + `imob.fichas_count`.

