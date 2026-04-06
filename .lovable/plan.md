

# Polimento Final — Lista de Registros Mobile

## Avaliação

A tela está bem compacta e funcional. Os ajustes são cosméticos:
- Filtro "Parceiro" depende de ícone `Users` sem texto no mobile — pouco claro
- "(parceiro)" e "(c/ parceiro)" como texto solto junto ao protocolo parece improvisado
- Lixeira no header do card ainda compete visualmente com status badge
- Contadores nos filtros são úteis mas poderiam ter mais contraste

## Refinamentos

### 1. Filtros — labels mais claros (linhas 185-191)
- Tab Parceiro no mobile: adicionar texto "Parc." ao lado do ícone (como as outras tabs têm texto)
- Contadores: trocar `opacity-70` por `opacity-50` e `bg-muted-foreground/10 rounded-full px-1.5` para parecerem "pills" discretas — mais legíveis que número solto

### 2. Atributo parceiro — visual consistente (linhas 237-242)
- Trocar texto "(parceiro)" / "(c/ parceiro)" por micro-badges com dot colorido:
  - `parceiro`: dot azul + "parceiro" em `text-[10px]` com `bg-blue-500/10 px-1.5 py-0.5 rounded-full`
  - `c/ parceiro`: dot roxo + "c/ parceiro" com `bg-purple-500/10 px-1.5 py-0.5 rounded-full`
- Mover da linha do protocolo para a linha de metadados (tipo + data), onde atributos fazem mais sentido semanticamente

### 3. Lixeira menos intrusiva (linhas 268-282)
- Mover a ação de delete/descartar para a linha de metadados (tipo + data), no canto direito
- Reduzir de `opacity-40` para `opacity-30` e manter `hover:opacity-100`
- Separar fisicamente da badge de status para não competir

### 4. Header do card — mais limpo (linhas 232-284)
- Linha 1: protocolo (esquerda) + status badge (direita) — só esses dois, sem delete
- Linha 2: endereço (como está)
- Linha 3: tipo + data + atributo parceiro + delete (tudo junto, metadados)

### 5. Contador contextual no subtítulo
- Atual: `{fichas.length} de {totalCount} registros`
- Quando filtro ativo: mostrar `{filteredFichas.length} de {totalCount}` para refletir o filtro

### 6. Espaçamento fino
- Reduzir gap entre busca e lista: `mb-3` → `mb-2`
- Manter `space-y-2` entre cards

## Microcopy

| Bloco | Atual | Novo |
|-------|-------|------|
| Tab parceiro mobile | (só ícone) | Ícone + "Parc." |
| Atributo parceiro | "(parceiro)" texto | Micro-badge com dot |
| Subtítulo com filtro | "{n} de {total} registros" | "{filtered} de {total}" quando filtrado |

## Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ListaFichas.tsx` | Reorganizar linhas do card mobile, micro-badges parceiro, lixeira rebaixada, filtro parceiro com texto, contadores pill |

## Sem mudança
- Desktop layout
- Queries, filtros, navegação
- Cores, fontes, identidade visual

