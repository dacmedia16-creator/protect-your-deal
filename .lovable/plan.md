

# Refinamento da Lista de Registros Mobile

## Avaliação rápida

A tela está funcional e bem estruturada. Os pontos de melhoria são cirúrgicos:
- Cards ocupam muita altura vertical (4 seções internas com border-t)
- Badges de "Parceiro" e status competem visualmente no mesmo nível
- Ação de excluir (lixeira) fica na mesma linha que nomes, criando ruído
- Busca e filtros são blocos separados sem integração visual
- Linha "Prop: / Comp:" ocupa espaço mas raramente é útil na listagem

## Refinamentos por bloco

### 1. Cards mais compactos (linhas 230-306)
- **Remover a linha "Prop: / Comp:"** do mobile — essa info já está na página de detalhes e raramente ajuda na listagem
- **Mover a lixeira** para o canto superior direito do card (ao lado do status), com `opacity-50` para não competir
- **Reduzir `space-y-2` → `space-y-1.5`** e `p-3` → `p-2.5` para ganhar ~20% de densidade
- **Resultado**: card passa de 4 seções para 3 (protocolo+status, endereço, tipo+data)

### 2. Filtros mais claros (linhas 168-194)
- **Labels**: "Pend." → "Pendentes" (cabe se removermos o ícone Users da tab Parceiro no mobile e usarmos texto curto)
- Na verdade, manter as abreviações mas adicionar `title` para acessibilidade
- **TabsList**: adicionar `w-full` no mobile para distribuir tabs uniformemente em vez de `min-w-full`

### 3. Busca integrada (linhas 196-207)
- **Reduzir `mb-4` → `mb-3`** entre busca e lista para menos espaço desperdiçado
- **Placeholder mais específico**: "Buscar por protocolo, endereço..." → "Protocolo, endereço ou nome..."
- **Reduzir altura**: `h-10` → `h-9` no mobile para proporção melhor com os cards compactos

### 4. Hierarquia status vs atributo (linhas 231-273)
- **Status** (Pendente, Confirmado): manter como `Badge` com ícone — é a info principal
- **Parceiro/C/ Parceiro**: trocar de `Badge` para um indicador mais discreto — um pequeno dot ou texto `text-[10px]` sem borda, posicionado junto ao protocolo
- Isso cria separação clara: badges = estado do registro, texto sutil = atributo

### 5. Ação de excluir menos intrusiva
- Mover o botão de delete/descartar para dentro da linha do protocolo (canto direito), com `opacity-40 hover:opacity-100`
- Remover a seção `border-t` que existia só para abrigar nomes + delete
- Usar `onClick stopPropagation` já existente

### 6. Espaçamento da lista
- `space-y-3` → `space-y-2` entre cards para lista mais densa
- Manter `hover:shadow-medium` para feedback de toque

## Microcopy

| Bloco | Atual | Novo |
|-------|-------|------|
| Busca placeholder | "Buscar por protocolo, endereço..." | "Protocolo, endereço ou nome..." |
| Parceiro badge | Badge azul "Parceiro" | Texto discreto "(parceiro)" em azul |
| C/ Parceiro badge | Badge roxa "C/ Parceiro" | Texto discreto "(c/ parceiro)" em roxo |

## Arquivo alterado

| Arquivo | Mudança |
|---------|---------|
| `src/pages/ListaFichas.tsx` | Cards compactos, hierarquia status/atributo, delete discreto, busca refinada, espaçamento |

## Sem mudança em
- Desktop layout (intocado)
- Queries de dados, filtros, navegação
- Identidade visual, cores, fontes

