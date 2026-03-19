

## Árvore de Rede de Afiliados (Visualização Hierárquica)

### Contexto
Atualmente o dialog "Ver Rede" mostra apenas os indicados diretos (1 nível) em formato de tabela. O pedido é transformar isso em uma **árvore hierárquica** que mostre múltiplos níveis de indicação.

### Solução
Transformar o dialog de rede em uma visualização em árvore recursiva, onde cada afiliado pode ser expandido para ver seus próprios indicados, formando uma estrutura visual tipo árvore.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/AdminAfiliados.tsx` | Substituir tabela plana no dialog de rede por componente de árvore recursivo com expand/collapse |

### Como vai funcionar

1. Ao abrir "Ver Rede", busca os indicados diretos (nível 1) como já faz
2. Cada indicado tem um botão de expandir (chevron) que, ao clicar, busca os indicados daquele afiliado (nível 2+)
3. Indentação visual com linhas conectoras para representar a hierarquia
4. Cada nó mostra: nome, email, status (badge), data de cadastro
5. Carregamento lazy — só busca sub-indicados quando o nó é expandido

### Detalhes técnicos

Componente interno `NetworkTreeNode` recursivo que:
- Recebe um afiliado como prop
- Tem estado `expanded` local
- Ao expandir, faz query `supabase.from("afiliados").select(...).eq("indicado_por", afiliado.id)`
- Renderiza filhos com padding-left crescente
- Usa ícones `ChevronRight`/`ChevronDown` para indicar estado
- Mostra contador de indicados ao lado do nome quando disponível

Sem necessidade de migration — usa a mesma query existente recursivamente.

