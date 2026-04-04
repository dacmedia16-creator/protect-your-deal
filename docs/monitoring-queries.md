# Queries de Monitoramento — VisitaProva

Queries pré-escritas para monitoramento de ações sensíveis e logs operacionais.

---

## 1. Ações sensíveis em audit_logs

### IMPERSONATE recentes (últimas 24h)

```sql
SELECT id, user_id, action, table_name, record_id,
       new_data->>'target_user_id' AS target,
       ip_address, created_at
FROM audit_logs
WHERE action IN ('IMPERSONATE', 'IMPERSONATE_FAILED')
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### DELETEs recentes (últimas 24h)

```sql
SELECT id, user_id, action, table_name, record_id,
       old_data, ip_address, created_at
FROM audit_logs
WHERE action = 'DELETE'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Todas ações de um usuário específico

```sql
SELECT action, table_name, record_id, created_at
FROM audit_logs
WHERE user_id = '<UUID>'
ORDER BY created_at DESC
LIMIT 50;
```

---

## 2. WhatsApp logs

### Falhas recentes (últimas 24h)

```sql
SELECT id, telefone, canal, tipo, status,
       error_message, created_at
FROM whatsapp_logs
WHERE status = 'failed'
  AND created_at > now() - interval '24 hours'
ORDER BY created_at DESC;
```

### Volume por canal (últimas 24h)

```sql
SELECT canal, status, count(*) AS total
FROM whatsapp_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY canal, status
ORDER BY canal, status;
```

### Últimos 20 envios

```sql
SELECT id, telefone, canal, tipo, status,
       error_message, metadata, created_at
FROM whatsapp_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 3. Webhook logs não processados

```sql
SELECT id, event_type, status, error_message, created_at
FROM webhook_logs
WHERE status != 'processed'
  AND created_at > now() - interval '48 hours'
ORDER BY created_at DESC;
```

---

## Notas

- Executar via Lovable Cloud (backend) ou `psql`.
- `audit_logs` é imutável (sem UPDATE/DELETE por design).
- `whatsapp_logs` é imutável (sem UPDATE/DELETE por RLS).
