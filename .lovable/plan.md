

## Plano: Enviar email de teste simulando boas-vindas de afiliado

### O que será feito

Chamar a edge function `send-email` diretamente via `curl_edge_functions` para enviar um email de teste para `dacmedia16@gmail.com` com o mesmo HTML que um novo afiliado receberia (com email e senha temporária fictícia).

### Detalhes

- **Remetente:** `noreply@visitaprova.com.br`
- **Destinatário:** `dacmedia16@gmail.com`
- **Assunto:** "Seu acesso ao painel de afiliados foi criado"
- **Conteúdo:** HTML idêntico ao template de novo usuário, com dados fictícios (nome "Afiliado Teste", senha "abc123XY!")
- **Método:** Chamada direta à edge function `send-email` com `action: "send"`

Nenhum arquivo será alterado — apenas um disparo de teste.

