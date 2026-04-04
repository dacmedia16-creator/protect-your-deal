

# Correção da query de webhook_logs

## Problema
A query de `webhook_logs` em `docs/monitoring-queries.md` referencia uma coluna `status` que não existe — o schema real usa `processed` (boolean).

## Mudança
No arquivo `docs/monitoring-queries.md`, seção "3. Webhook logs não processados", substituir:

```sql
SELECT id, event_type, status, error_message, created_at
FROM webhook_logs
WHERE status != 'processed'
```

Por:

```sql
SELECT id, event_type, processed, error_message, created_at
FROM webhook_logs
WHERE processed = false
```

## Arquivo tocado
- `docs/monitoring-queries.md` (1 bloco SQL corrigido)

