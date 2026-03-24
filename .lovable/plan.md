

## Adicionar seção "Para Imobiliárias" na Landing Page

### Resumo
Inserir uma seção dedicada entre a seção "Prova Social / Autoridade" (linha 504) e a seção "Planos e Preços" (linha 522), com argumentos direcionados a imobiliárias.

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `src/pages/Index.tsx` | Adicionar nova seção "Para Imobiliárias" entre as linhas 520-522 |

### Conteúdo da seção

- **Badge**: Ícone Building + "Para Imobiliárias"
- **Título**: "Gestão completa da sua equipe de corretores"
- **2 cards** com os argumentos:
  1. Ícone Users + "Controle em tempo real" — "Tenha controle em tempo real de quais clientes sua equipe está atendendo."
  2. Ícone Shield + "Proteção do histórico" — "Fim do roubo de clientes: se um corretor sair da imobiliária, o histórico de visitas e a prova de intermediação ficam com a empresa."
- **CTA**: Botão "Cadastrar minha Imobiliária" linkando para `/registro/tipo`
- **Estilo**: fundo `bg-muted/30`, cards com `bg-card border`, consistente com as demais seções

