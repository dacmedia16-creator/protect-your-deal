

## Plano: Corrigir erro ao arquivar convites

### Problema
A coluna `status` da tabela `convites_parceiro` tem um CHECK constraint que só aceita: `pendente`, `aceito`, `expirado`. O valor `arquivado` é rejeitado pelo banco.

### Solução
**Migration SQL**: Alterar o CHECK constraint para incluir `'arquivado'`:

```sql
ALTER TABLE convites_parceiro DROP CONSTRAINT convites_parceiro_status_check;
ALTER TABLE convites_parceiro ADD CONSTRAINT convites_parceiro_status_check 
  CHECK (status = ANY (ARRAY['pendente', 'aceito', 'expirado', 'arquivado']));
```

Nenhuma alteração de código necessária — o frontend já está implementado corretamente.

