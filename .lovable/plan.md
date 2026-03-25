

## Adicionar Seção "Palavras do CEO" na Página Sobre Nós

### Resumo
Inserir uma seção com a foto do CEO e sua citação entre a seção "Nossa História" e "Por que existimos" na página `/sobre`.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `src/assets/ceo-photo.png` | Copiar a imagem enviada pelo usuário |
| `src/pages/SobreNos.tsx` | Adicionar seção "Palavras do CEO" após a seção "Nossa História" (após linha ~157) |

### Design da seção

Layout 2 colunas (`md:grid-cols-[280px_1fr]`):
- **Esquerda**: Foto do CEO em formato arredondado com borda e sombra
- **Direita**: Citação em destaque com aspas estilizadas, nome e cargo abaixo

```text
┌──────────────────────────────────────┐
│  ┌──────────┐  "O Visita Prova      │
│  │          │  nasceu de uma dor     │
│  │  [FOTO]  │  real que eu..."       │
│  │          │                        │
│  └──────────┘  — Fundador & CEO      │
└──────────────────────────────────────┘
```

- Citação com `border-l-4 border-primary` e texto em itálico
- Fundo limpo (sem `bg-muted/30` pois a seção anterior já usa)
- `AnimatedSection` com delay incremental

