

## Melhorar Visualização da Rede de Afiliados no Dashboard do Afiliado

### Contexto
Atualmente o card "Minha Rede" no dashboard do afiliado mostra apenas o número total de indicados. Não há como o afiliado ver **quem** são seus indicados (nome, email, status). A screenshot confirma: só aparece "1 - Afiliados indicados por você".

### Solução
Adicionar uma seção "Minha Rede" com uma tabela/lista dos afiliados indicados, mostrando nome, email, status (ativo/inativo) e data de cadastro. Será posicionada após os cards de estatísticas e antes dos links.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/afiliado/AfiliadoDashboard.tsx` | Adicionar seção "Minha Rede" com tabela listando os afiliados indicados (nome, email, status, data) + buscar `created_at` na query existente |

### Detalhes técnicos

1. Atualizar a query `afiliado-rede` para incluir `created_at` no select
2. Adicionar um Card "Minha Rede" com tabela após os cards de estatísticas (só aparece se `totalRede > 0`)
3. Cada linha mostra: nome, email, Badge ativo/inativo, data formatada com `date-fns`
4. Estado vazio com mensagem quando não há indicados

