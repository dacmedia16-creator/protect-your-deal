

## Adicionar email de boas-vindas no registro de imobiliária

### Mudança

| Arquivo | O que fazer |
|---------|------------|
| `supabase/functions/registro-imobiliaria/index.ts` | Adicionar bloco de envio do email `boas_vindas` (não-bloqueante) logo após o bloco de WhatsApp (após linha 331), usando o mesmo padrão do corretor autônomo: `fetch` para `send-email` com `action: 'send-template'`, `template_tipo: 'boas_vindas'`, e variáveis `nome`, `email`, `link` |

### Código a inserir

Bloco idêntico ao usado em `registro-corretor-autonomo`: chamada `fetch` para `/functions/v1/send-email` com `SERVICE_ROLE_KEY`, enviando o template `boas_vindas` para `admin.email` com `nome: admin.nome`, `email: admin.email` e `link: 'https://visitaprova.com.br/auth'`. Envio não-bloqueante (try/catch com log de erro).

