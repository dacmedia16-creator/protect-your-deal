

## Plano: Corrigir exclusão de construtoras

### Problema
As foreign keys `user_roles_construtora_id_fkey`, `assinaturas_construtora_id_fkey`, `fichas_visita_construtora_id_fkey` e `profiles_construtora_id_fkey` não têm `ON DELETE CASCADE`, então a exclusão falha quando há registros vinculados.

As FKs de `empreendimentos` e `construtora_imobiliarias` já têm CASCADE.

### Correção

**Migração SQL — alterar 4 foreign keys para CASCADE ou SET NULL**

```sql
-- user_roles: CASCADE (deletar roles junto)
ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_construtora_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE CASCADE;

-- assinaturas: CASCADE (deletar assinaturas junto)
ALTER TABLE public.assinaturas DROP CONSTRAINT assinaturas_construtora_id_fkey;
ALTER TABLE public.assinaturas ADD CONSTRAINT assinaturas_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE CASCADE;

-- fichas_visita: SET NULL (manter fichas, limpar referência)
ALTER TABLE public.fichas_visita DROP CONSTRAINT fichas_visita_construtora_id_fkey;
ALTER TABLE public.fichas_visita ADD CONSTRAINT fichas_visita_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE SET NULL;

-- profiles: SET NULL (manter perfis, limpar referência)
ALTER TABLE public.profiles DROP CONSTRAINT profiles_construtora_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_construtora_id_fkey
  FOREIGN KEY (construtora_id) REFERENCES construtoras(id) ON DELETE SET NULL;
```

Nenhuma alteração de código necessária — o `deleteConstrutora` em `AdminConstrutoras.tsx` já faz o delete corretamente, o banco é que bloqueia.

