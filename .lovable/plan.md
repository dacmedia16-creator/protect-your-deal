

## Plano: Enviar email de teste via noreply@visitaprova.com.br

### O que será feito

Disparar um email de teste para `dacmedia16@gmail.com` usando a edge function `send-email` com `from_email: "noreply@visitaprova.com.br"` para validar que o bloco de credenciais noreply está funcionando corretamente após a configuração dos secrets.

### Detalhes

- **Método:** `curl_edge_functions` chamando `send-email` com service role key
- **Remetente:** `noreply@visitaprova.com.br`
- **Destinatário:** `dacmedia16@gmail.com`
- **Assunto:** "Teste - Remetente Noreply"
- **Conteúdo:** HTML simples confirmando que o envio pelo noreply está operacional
- **Validação:** Verificar no response se `from` retorna `noreply@visitaprova.com.br` (e não denis)

Nenhum arquivo será alterado — apenas um disparo de teste.

