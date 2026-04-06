

# Refinamento UX da Home Mobile

## O que já está bom
- CTA "Registrar Nova Visita" em destaque no topo — correto
- Seção "Precisa da sua atenção" condicional — bom padrão
- Stats em 3 colunas compactas — funcional
- Navegação inferior renomeada — mais claro

## Refinamentos propostos

### 1. Subtítulo contextual no topo (linha 449-451)
Substituir o "Olá, {nome}" isolado por uma saudação com subtítulo operacional dinâmico:
- Se há pendências: "Você tem X pendências hoje"
- Se tudo ok: "Tudo em dia ✓"
- Se não há fichas: "Comece registrando sua primeira visita"

Isso transforma o header de decorativo em informativo.

### 2. "Registro Construtoras" com menos peso (linhas 463-472)
O botão outline de construtoras compete visualmente com o CTA principal. Mudança:
- Reduzir de `Button` para uma linha compacta dentro da seção "atenção" ou um link discreto
- Usar tamanho `sm`, sem borda colorida, texto `text-muted-foreground` com ícone sutil
- Só aparece se há parcerias ativas — manter essa lógica

### 3. Métricas com microcopy de status (linhas 476-508)
Adicionar uma linha de contexto abaixo de cada número nos stats cards:
- Total: sem subtítulo extra (já é claro)
- Confirmados: se todos confirmados → "tudo em dia" em verde; senão manter "Confirmados"
- Pendentes: se 0 → "nenhuma pendência" em verde; se > 0 → manter com cor warning

Isso dá leitura instantânea de status sem ocupar mais espaço.

### 4. Seção "Precisa da sua atenção" — estado vazio positivo (linhas 511-550)
Quando não há itens pendentes, em vez de esconder a seção, mostrar uma mensagem compacta de reforço positivo:
- "Tudo em dia — nenhuma pendência" com ícone CheckCircle verde
- Isso evita que a home pareça "vazia" quando tudo está ok

### 5. Ajuste de espaçamento e peso visual
- Reduzir `space-y-4` para `space-y-3` no container mobile para tela mais compacta
- Card "Ajuda Jurídica" (linhas 579-592): reduzir padding de `p-3` para `p-2.5`, manter discreto como está
- Card "Indicações" (linhas 598-613): manter no final, sem alterações — já está equilibrado

### 6. Nenhuma mudança em
- Desktop layout (intocado)
- Queries de dados
- Navegação inferior (já refinada)
- Identidade visual, cores, fontes, shadows

## Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `src/pages/Dashboard.tsx` | Subtítulo contextual, construtoras discreto, microcopy nos stats, estado positivo na seção atenção, ajuste de espaçamento |

## Microcopy final

| Bloco | Atual | Proposto |
|-------|-------|----------|
| Saudação sub | (nenhum) | "Tudo em dia ✓" / "X pendências hoje" |
| Pendentes = 0 | (oculto) | "nenhuma pendência" (verde) |
| Confirmados = total | "Confirmados" | "tudo em dia" (verde) |
| Atenção vazia | (seção oculta) | "Tudo em dia — nenhuma pendência ✓" |
| Construtoras | Botão outline com borda laranja | Botão `ghost` tamanho `sm`, texto muted |

