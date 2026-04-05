

# Diagnóstico: RLS bloqueando descarte de parceria em `fichas_visita`

## 1. Causa raiz

A policy de UPDATE para corretor parceiro usa `corretor_parceiro_id = auth.uid()` como `USING`. Como **não há `WITH CHECK` explícito**, o PostgreSQL reutiliza a expressão `USING` para validar a linha **após** o update. O descarte seta `corretor_parceiro_id = null`, então `null = auth.uid()` retorna `false` e a policy rejeita a nova linha.

## 2. USING vs WITH CHECK neste caso

- **USING** (OLD row): `corretor_parceiro_id = auth.uid()` → passa, porque o parceiro ainda está vinculado
- **WITH CHECK** (NEW row, implícito = cópia do USING): `null = auth.uid()` → falha, porque o campo foi anulado

## 3. Policy a corrigir

```
Policy: "Corretor parceiro pode atualizar fichas"
Command: UPDATE
USING: (corretor_parceiro_id = auth.uid()) AND is_user_active(auth.uid())
WITH CHECK: (implícito = mesmo que USING) ← problema aqui
```

Nenhuma outra policy de UPDATE cobre este caso — as demais exigem `user_id = auth.uid()` ou `is_super_admin`.

## 4. Campos que mudam e quebram a policy

| Campo | Valor antes | Valor depois | Efeito na policy |
|-------|------------|-------------|-----------------|
| `corretor_parceiro_id` | `auth.uid()` | `null` | WITH CHECK falha |
| `parte_preenchida_parceiro` | texto | `null` | Sem efeito direto |

## 5. Correção de menor risco

Recriar a policy adicionando um `WITH CHECK` explícito que permita ao parceiro anular seu próprio vínculo:

```sql
DROP POLICY "Corretor parceiro pode atualizar fichas" ON public.fichas_visita;

CREATE POLICY "Corretor parceiro pode atualizar fichas"
ON public.fichas_visita
FOR UPDATE
TO authenticated
USING (
  (corretor_parceiro_id = auth.uid()) AND is_user_active(auth.uid())
)
WITH CHECK (
  (corretor_parceiro_id IS NULL OR corretor_parceiro_id = auth.uid())
  AND is_user_active(auth.uid())
);
```

Isso permite que a nova linha tenha `corretor_parceiro_id = null` (descarte) ou mantenha o mesmo valor (edições normais do parceiro), sem abrir escopo para o parceiro vincular outro user_id.

## 6. Checklist de validação

- [ ] Corretor parceiro consegue descartar parceria sem erro RLS
- [ ] Corretor parceiro consegue editar campos normalmente (ex: parte do comprador)
- [ ] Corretor parceiro NÃO consegue alterar `corretor_parceiro_id` para outro UUID
- [ ] Corretor proprietário (`user_id`) não é afetado
- [ ] Super admin continua podendo atualizar fichas
- [ ] Líder de equipe continua podendo atualizar fichas da equipe

## Detalhes técnicos

- **Escopo**: 1 migration SQL (drop + create policy)
- **Risco**: Baixo — apenas adiciona `WITH CHECK` explícito, sem alterar `USING`
- **Frontend**: Zero mudanças necessárias — o código do `DescartarFichaDialog` já está correto
- **Rollback**: Recriar a policy original sem `WITH CHECK`

