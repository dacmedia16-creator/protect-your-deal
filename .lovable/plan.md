

## Adicionar link dos tutoriais na mensagem de boas-vindas do WhatsApp

Inserir o link `https://visitaprova.com.br/tutoriais` nas mensagens de boas-vindas enviadas via WhatsApp no cadastro, orientando o novo usuário a acessar o passo a passo de como usar o app.

### Mudanças

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/registro-corretor-autonomo/index.ts` (linha ~444) | Adicionar ao final da `mensagemBoasVindas`: parágrafo com link para os tutoriais |
| `supabase/functions/registro-imobiliaria/index.ts` (linha ~306) | Mesma alteração na `mensagemBoasVindas` |

### Texto a adicionar (ao final da mensagem, antes do fechamento)

> 📲 Para aprender a usar o app passo a passo, acesse nossos tutoriais:
> https://visitaprova.com.br/tutoriais

Ambas as functions serão redeployadas automaticamente.

