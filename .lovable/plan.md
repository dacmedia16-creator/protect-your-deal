

## Inativar planos Grande e Max

### Situação atual
- **Grande** (R$ 997,90/mês) — ativo, CNPJ
- **Max** (R$ 1.499,00/mês) — ativo, CNPJ
- **2 assinaturas ativas** usam esses planos (continuarão funcionando, apenas não aparecerão para novos cadastros)

### Correção
Uma migration SQL para setar `ativo = false` nos dois planos:

```sql
UPDATE planos SET ativo = false WHERE id IN (
  '661cdabb-b171-4f4f-abfa-a00c353af4a3',
  '4f9792c2-746d-49f2-b839-12872a064083'
);
```

### Impacto
- Assinaturas existentes **não são afetadas** — continuam funcionando normalmente
- Os planos deixam de aparecer nas telas de registro e upgrade (já filtradas por `ativo = true`)
- Nenhuma mudança no frontend

