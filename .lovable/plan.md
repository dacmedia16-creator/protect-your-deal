

## Corrigir injeção cross-tenant na tabela surveys

### Problema
A política ALL `"Corretor can manage their own surveys"` usa apenas `auth.uid() = corretor_id`, sem validar `imobiliaria_id`. Um corretor pode inserir/atualizar surveys com `imobiliaria_id` de outra organização, injetando dados PII no dashboard de terceiros.

### Correção
Substituir a política ALL por políticas granulares com WITH CHECK que valida `imobiliaria_id`:

```sql
DROP POLICY "Corretor can manage their own surveys" ON public.surveys;

-- SELECT: corretor vê suas próprias surveys
CREATE POLICY "Corretor pode ver suas surveys"
ON public.surveys FOR SELECT TO authenticated
USING (auth.uid() = corretor_id);

-- INSERT: corretor só cria survey na sua imobiliária (ou NULL para autônomos)
CREATE POLICY "Corretor pode criar surveys"
ON public.surveys FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = corretor_id
  AND (
    (imobiliaria_id IS NULL AND get_user_imobiliaria(auth.uid()) IS NULL)
    OR (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  )
);

-- UPDATE: corretor só atualiza suas surveys mantendo imobiliaria_id válida
CREATE POLICY "Corretor pode atualizar suas surveys"
ON public.surveys FOR UPDATE TO authenticated
USING (auth.uid() = corretor_id)
WITH CHECK (
  auth.uid() = corretor_id
  AND (
    (imobiliaria_id IS NULL AND get_user_imobiliaria(auth.uid()) IS NULL)
    OR (imobiliaria_id = get_user_imobiliaria(auth.uid()))
  )
);

-- DELETE: corretor pode deletar suas próprias surveys
CREATE POLICY "Corretor pode deletar suas surveys"
ON public.surveys FOR DELETE TO authenticated
USING (auth.uid() = corretor_id);
```

### Escopo
- 1 migration SQL
- 0 arquivos frontend alterados

