

## Adicionar botão "Cancelar Plano" nas páginas de assinatura

### O que será feito
Adicionar um botão de cancelamento na seção "Sua Assinatura" das 3 páginas de assinatura. Ao clicar, um diálogo de confirmação aparece. Ao confirmar, a edge function `asaas-cancel-subscription` é chamada para cancelar no Asaas e no banco.

### Alterações

#### 1. Criar componente `CancelarAssinaturaDialog.tsx`
- Diálogo de confirmação com AlertDialog
- Texto explicando que o cancelamento impede cobranças futuras
- Botão "Confirmar Cancelamento" que chama `supabase.functions.invoke('asaas-cancel-subscription', { body: { assinaturaId } })`
- Loading state durante a chamada
- Toast de sucesso/erro + callback para refetch dos dados

#### 2. Adicionar botão nas 3 páginas de assinatura
Em `EmpresaAssinatura.tsx`, `ConstutoraAssinatura.tsx` e `CorretorAssinatura.tsx`:
- Dentro do card "Sua Assinatura", após as stats de uso, adicionar botão "Cancelar Plano" (variant destructive/outline)
- Visível apenas quando `assinatura.status === 'ativa'` e `assinatura.asaas_subscription_id` existe
- Ao clicar, abre o `CancelarAssinaturaDialog`

#### 3. Edge function (`asaas-cancel-subscription`)
Já existe e funciona. Também verifica permissão de construtora se necessário — precisa adicionar check para `construtora_id`:

```typescript
if (assinatura.construtora_id) {
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('construtora_id', assinatura.construtora_id)
    .eq('role', 'construtora_admin')
    .maybeSingle();
  isAdmin = !!roleData;
}
```

### Fluxo
1. Usuário vê botão "Cancelar Plano" no card da assinatura ativa
2. Clica → diálogo de confirmação aparece
3. Confirma → edge function cancela no Asaas + atualiza banco
4. Toast de sucesso, dados recarregados, status muda para "cancelada"

