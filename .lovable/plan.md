

# Remover header "VisitaProva" da pagina ConfirmarVisita

## Problema

A pagina de confirmacao de visita (`/confirmar/:token`) exibe um header com icone e nome da marca. O usuario quer remover esse header completamente.

## Solucao

Remover o bloco `<header>` (linhas 379-386) do arquivo `src/pages/ConfirmarVisita.tsx`.

## Arquivo modificado

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ConfirmarVisita.tsx` | Remover o bloco `<header>` com o icone Shield e o texto da marca (linhas 379-386) |

Alteracao simples de remocao de 8 linhas.

