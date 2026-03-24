

## Adicionar Seção "Conheça a Sofia" na Landing Page

### Resumo
Criar uma seção de destaque visual apresentando a assistente Sofia (IA), posicionada entre a seção "Para Imobiliárias" e "Planos e Preços" (entre linhas 575-577). Incluir o mockup já existente `SofiaMockup`.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` | Adicionar nova seção entre "Para Imobiliárias" e "Pricing". Importar `SofiaMockup`. Layout 2 colunas: texto à esquerda, mockup à direita |

### Design da seção

- **Fundo**: gradiente sutil `bg-gradient-to-br from-primary/5 via-transparent to-accent/5`
- **Badge**: Ícone Wand2 + "Assistente IA"
- **Título**: "Conheça a Sofia: Sua Assistente Inteligente"
- **Subtítulo**: Texto explicando que a Sofia ajuda em tempo real, conhece o sistema e sugere ações
- **Benefícios**: lista com check icons (Ajuda contextual por página, Disponível 24/7, Respostas instantâneas, Sugere próximos passos)
- **Mockup**: `SofiaMockup` à direita com borda e sombra (mesmo estilo dos mockups da página Funcionalidades)
- **Layout**: Grid `md:grid-cols-2`, texto à esquerda centralizado em mobile, mockup à direita

