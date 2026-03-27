

## Plano: Corrigir acesso de corretores da construtora aos empreendimentos

### Problema
A tabela `empreendimentos` tem RLS que permite leitura apenas para `construtora_admin` (via `is_construtora_admin`). Corretores vinculados à construtora **não têm permissão de SELECT**, então a query no `NovaFicha.tsx` retorna vazio para eles.

### Solução
Adicionar uma política RLS de SELECT na tabela `empreendimentos` para corretores da construtora:

```sql
CREATE POLICY "Corretor da construtora pode ver empreendimentos"
  ON public.empreendimentos
  FOR SELECT
  TO authenticated
  USING (
    construtora_id IN (
      SELECT ur.construtora_id FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.construtora_id IS NOT NULL
    )
  );
```

Isso permite que qualquer usuário vinculado à construtora (admin ou corretor) veja os empreendimentos da sua construtora.

### Alteração
- 1 migração SQL — nova RLS policy na tabela `empreendimentos`

Nenhuma alteração de código frontend necessária.

