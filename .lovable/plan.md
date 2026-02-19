

# Corrigir: Super Admin nao consegue ativar/desativar usuarios

## Problema

A politica RLS da tabela `profiles` so permite UPDATE quando `user_id = auth.uid()` (o proprio usuario). Nao existe nenhuma politica que permita o Super Admin atualizar perfis de outros usuarios.

Quando o Super Admin tenta ativar/desativar um usuario, o Supabase silenciosamente bloqueia o UPDATE por causa do RLS, e a operacao falha ou nao tem efeito.

## Solucao

Criar uma nova politica RLS de UPDATE na tabela `profiles` que permita ao Super Admin atualizar qualquer perfil:

```sql
CREATE POLICY "Super admin pode atualizar qualquer perfil"
  ON public.profiles
  FOR UPDATE
  USING (public.is_super_admin(auth.uid()));
```

Tambem adicionar uma politica para o Admin da Imobiliaria poder atualizar perfis dos corretores da sua imobiliaria:

```sql
CREATE POLICY "Admin imobiliaria pode atualizar perfis da sua imobiliaria"
  ON public.profiles
  FOR UPDATE
  USING (
    imobiliaria_id = public.get_user_imobiliaria(auth.uid())
    AND public.is_imobiliaria_admin(auth.uid(), imobiliaria_id)
  );
```

## Impacto

- 1 migration SQL com 2 novas politicas RLS
- Nenhuma alteracao de codigo frontend necessaria
- Resolve o problema para Super Admin e tambem para Admin de Imobiliaria

