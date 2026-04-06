

# Polimento Final da Home Mobile

## Avaliação rápida

A tela atual está bem estruturada. Os ajustes são cirúrgicos:

## Refinamentos

### 1. Topo — subtítulo mais contextual
**Atual**: "Você tem X pendências hoje" / "Tudo em dia ✓" / "Comece registrando..."
**Proposto**: Adicionar contexto temporal e operacional:
- 0 fichas: "Comece registrando sua primeira visita"
- Pendências > 0: "Você tem **X pendências** para resolver" (sem "hoje" — pendências não são necessariamente de hoje)
- Tudo ok, com fichas: "Nenhuma pendência · **{totalFichas}** registros" — dá contexto de volume
- Adicionar `mb-1` entre subtítulo e CTA para melhor respiração

### 2. "Registro via Construtora" — mais autoexplicativo
**Atual**: `Registro via Construtora` (ghost button, pouco contexto)
**Proposto**: 
- Texto: "Registrar visita de empreendimento" — descreve a ação, não o mecanismo
- Adicionar `text-xs` com `opacity-70` para manter hierarquia abaixo do CTA
- Manter `variant="ghost"` e `size="sm"`

### 3. Métricas — mais funcionais
**Atual**: Cards com número + label estática ("Total", "Confirmados/tudo em dia", "Pendentes/nenhuma")
**Proposto**:
- Adicionar label de porcentagem no card "Confirmados" quando total > 0: ex. "8 de 10" como subtítulo em `text-[9px]`
- Card "Pendentes" com pendências > 0: subtítulo "aguardando" em warning para reforçar urgência
- Reduzir `text-xl` → `text-lg` nos números para proporção mais equilibrada com labels

### 4. Blocos secundários — reordenar
**Atual**: Equipe → Ajuda Jurídica → PlanUsage → Indicações
**Proposto**: 
- PlanUsage sobe (mais relevante no dia a dia do que Ajuda Jurídica)
- Ordem: Equipe → PlanUsage → Indicações → Ajuda Jurídica (último, é ação excepcional)
- Ajuda Jurídica: reduzir para `p-2.5`, `text-xs` na descrição

### 5. Estado positivo "Tudo em dia"
**Atual**: Linha solta com ícone
**Proposto**: Envolver em card leve (`bg-success/5 border-0 rounded-xl`) para dar consistência visual com os outros blocos

### 6. Espaçamento
- `mb-2` entre subtítulo de status e CTA (mais respiração)
- Gap entre seção atenção e stats: manter `space-y-3` (já bom)

## Arquivo alterado
`src/pages/Dashboard.tsx` — apenas o bloco `sm:hidden` (mobile layout)

## Microcopy final

| Bloco | Atual | Novo |
|-------|-------|------|
| Sub sem fichas | "Comece registrando sua primeira visita" | (manter) |
| Sub com pendências | "Você tem X pendências hoje" | "Você tem X pendências para resolver" |
| Sub tudo ok | "Tudo em dia ✓" | "Nenhuma pendência · {total} registros" |
| Construtora | "Registro via Construtora" | "Registrar visita de empreendimento" |
| Confirmados sub | "tudo em dia" / "Confirmados" | "{n} de {total}" / "Confirmados" |
| Pendentes sub | "nenhuma" / "Pendentes" | "nenhuma" / "aguardando" |
| Estado positivo | Linha solta | Card leve bg-success/5 |

