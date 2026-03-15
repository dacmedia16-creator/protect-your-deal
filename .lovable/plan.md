

## Corrigir política INSERT aberta na tabela `webhook_logs`

### Problema
A política `"Sistema pode inserir webhook logs"` usa `WITH CHECK (true)` para o role `public`, permitindo que qualquer requisição não autenticada insira registros arbitrários. Um atacante poderia injetar eventos falsos de pagamento.

### Correção
Substituir a política para restringir INSERT apenas ao `service_role`:

```sql
DROP POLICY "Sistema pode inserir webhook logs" ON public.webhook_logs;

CREATE POLICY "Service role pode inserir webhook logs"
ON public.webhook_logs
FOR INSERT
TO service_role
WITH CHECK (true);
```

### Impacto
- Edge functions (que usam `SUPABASE_SERVICE_ROLE_KEY`) continuam inserindo normalmente
- Requisições anônimas ou autenticadas como usuário comum não conseguem mais inserir
- Nenhuma mudança no frontend

