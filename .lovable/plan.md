

## Plano: Corrigir constraint `chk_assinatura_owner`

### Problema
A constraint `chk_assinatura_owner` na tabela `assinaturas` só permite dois cenários (imobiliaria_id OR user_id), mas não reconhece `construtora_id` como owner válido.

### Correção

**Migração SQL — uma única alteração**

```sql
ALTER TABLE public.assinaturas DROP CONSTRAINT chk_assinatura_owner;

ALTER TABLE public.assinaturas
ADD CONSTRAINT chk_assinatura_owner CHECK (
  (imobiliaria_id IS NOT NULL AND user_id IS NULL AND construtora_id IS NULL) OR
  (imobiliaria_id IS NULL AND user_id IS NOT NULL AND construtora_id IS NULL) OR
  (imobiliaria_id IS NULL AND user_id IS NULL AND construtora_id IS NOT NULL)
);
```

Nenhuma alteração de código necessária — o insert em `AdminDetalhesConstrutora.tsx` já passa `construtora_id` corretamente.

