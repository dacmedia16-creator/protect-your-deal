

## Plano: Ícones do Dashboard no estilo quadriculado (grid de ícones)

### Objetivo
Transformar a seção "Ações Rápidas" mobile de uma lista vertical em um **grid de ícones quadrados** como na imagem de referência — ícones centralizados com label abaixo, dispostos em grid 3 ou 4 colunas.

### Alteração em `src/pages/Dashboard.tsx`

**Seção Mobile Quick Actions (linhas 617-685)**

Substituir o layout atual (lista vertical com cards horizontais) por um grid de ícones quadrados:

- Layout: `grid grid-cols-4 gap-4` (4 colunas como na imagem)
- Cada item: ícone dentro de um quadrado arredondado (`h-14 w-14 rounded-xl bg-muted`) centralizado, com label de texto pequeno abaixo
- Sem descrição secundária (só o nome da ação)
- Itens: Novo Registro, Fichas de visita, Convites, Indicações, Pesquisas (se habilitado), Ajuda Jurídica, Registro Construtoras (se habilitado)
- Manter os `data-tour` attributes existentes
- Manter as mesmas navegações `onClick`

**Visual de cada item:**
```text
┌──────────┐
│   ┌────┐ │
│   │ 📄 │ │
│   └────┘ │
│  Label   │
└──────────┘
```

Cores dos ícones mantidas (gradient-primary para Novo Registro, secondary para Fichas, amber para Jurídico, etc.)

