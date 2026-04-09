

# Plano: Indicador visual de hierarquia nas sub-equipes

## Resumo

Substituir o texto genérico "Sub-equipe" por um breadcrumb com ícone de hierarquia mostrando o nome da equipe pai (ex: `GitBranch ícone + "Equipe Alfa › Sub Beta"`), em ambas as páginas de equipes (Construtora e Empresa).

## Arquivos alterados

### 1. `src/pages/construtora/ConstutoraEquipes.tsx`

- Adicionar parâmetro `parentNome?: string` à função `renderEquipeCard`
- Na chamada recursiva (linha 417), passar `equipe.nome` como `parentNome`
- Substituir `<span>Sub-equipe</span>` (linha 369) por um breadcrumb visual:
  ```
  <GitBranch icon /> Parent › Nome
  ```
- Import `GitBranch` de lucide-react

### 2. `src/pages/empresa/EmpresaEquipes.tsx`

- Mesmas alterações: parâmetro `parentNome`, breadcrumb visual, import `GitBranch`
- Linha 466-468: substituir "Sub-equipe" pelo breadcrumb
- Chamada recursiva: passar `equipe.nome`

## Resultado visual

Antes: `Sub-equipe` (texto cinza genérico)

Depois: `⑂ Equipe Alfa › Sub Beta` (ícone GitBranch + breadcrumb com nome do pai em destaque, cor da equipe pai como accent)

