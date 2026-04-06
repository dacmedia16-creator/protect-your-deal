

# Refatoracao da Home Mobile — Plano de Nova Hierarquia

## Estrutura atual vs. proposta

```text
ATUAL                              PROPOSTA
─────────────────────              ─────────────────────
Header (logo + avatar)             Header (logo + avatar) [sem mudanca]
PWA Banner                         PWA Banner [sem mudanca]
Upgrade Banner                     Upgrade Banner [sem mudanca]
Convites Pendentes                 
Equipe (lider)                     ── ZONA PRIMARIA ──
Welcome "Bem-vindo, X!"           Saudacao compacta (1 linha)
                                   CTA Principal: "Registrar Visita"
Stats 3 cols (Total/Conf/Pend)       (botao grande, gradient, full-width)
                                   
Acoes Rapidas (4 cards)            Stats compactos (3 cols inline,
                                     sem container bg, numeros menores)
Fichas Parceiro                    
Pesquisas pie chart                ── ATENCAO ──
PlanUsage                         "Precisa da sua atencao" (condicional)
Indicacoes                          - Fichas pendentes (se > 0)
                                     - Convites pendentes (se > 0)
                                     - Fichas parceiro pendentes (se > 0)
                                     - Pesquisas pendentes (se > 0)
                                   
                                   ── ZONA SECUNDARIA ──
                                   Acoes rapidas (cards menores,
                                     sem "Ver Registros" duplicado)
                                   Equipe (lider, compacto)
                                   PlanUsage
                                   Indicacoes (menor, sem pulse)
```

## Mudancas por bloco

### 1. Saudacao + CTA Principal
- Reduzir welcome de 2 linhas para 1: "Ola, {nome}" (sem subtitle generico)
- Logo abaixo: botao full-width "Registrar Nova Visita" com gradiente primario, icone Plus, tamanho lg
- Se houver parcerias construtora, segundo botao outline abaixo
- **Resultado**: acao principal em destaque absoluto, acima de tudo

### 2. Stats compactos
- Remover container `bg-muted/30 rounded-2xl p-3` — stats ficam mais leves
- Manter 3 colunas mas reduzir padding, numeros de `text-2xl` para `text-xl`
- Remover `ChevronRight` dos cards de stats mobile (ja sao clicaveis)
- Labels mais diretos: "Total" / "Confirmados" / "Pendentes"

### 3. Secao "Precisa da sua atencao"
- Nova secao condicional que agrupa alertas existentes (convites pendentes, fichas pendentes, pesquisas pendentes, fichas parceiro pendentes)
- So aparece se ha itens pendentes
- Cada item e uma linha compacta clicavel com badge de contagem
- Substitui os cards avulsos de convites, fichas parceiro, pesquisas que hoje estao espalhados

### 4. Acoes rapidas simplificadas
- Remover "Ver Registros" (ja esta na tab bar como "Registros")
- Manter: "Ajuda Juridica" e "Registro Construtoras" (se aplicavel)
- Reduzir altura dos cards

### 5. Conteudo secundario
- Equipe (lider): mover para depois das acoes, manter compacto
- PlanUsage: manter compact, sem mudanca
- Indicacoes: remover `animate-attention-pulse`, diminuir padding, mover para o final

### 6. Menu inferior (MobileNav)
- "Inicio" → "Home" (mais universal)
- "Registros" → manter (ja e claro)
- "Convites" → "Parcerias" (mais descritivo do que faz)
- "Pesquisas" → manter
- "Sofia" → "Ajuda" (mais autoexplicativo para quem nao conhece a Sofia)

## Microcopy melhorado

| Atual | Proposto |
|-------|----------|
| "Bem-vindo, X!" | "Ola, {nome}" |
| "Gerencie seus registros de visita e clientes" | (removido — redundante) |
| "Total Registros" | "Total" |
| "Criar e enviar para confirmacao" | "Registrar visita e enviar para confirmar" |
| "Indique e Ganhe" | "Programa de Indicacao" |
| "Indique corretores e imobiliarias e ganhe comissao" | "Ganhe comissao indicando colegas" |

## Regras de implementacao

- Apenas `src/pages/Dashboard.tsx` e `src/components/MobileNav.tsx` serao editados
- Mudancas sao mobile-only (classes `sm:hidden` / `hidden sm:...`), desktop intocado
- Nenhum fluxo de negocio alterado, nenhuma query nova
- Nenhum componente novo criado, apenas reorganizacao do existente
- Identidade visual preservada (cores, fontes, border-radius, shadows do design system)

## Arquivos alterados

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Reordenar blocos mobile, CTA principal, secao "atencao", stats compactos |
| `src/components/MobileNav.tsx` | Renomear labels: Home, Parcerias, Ajuda |

