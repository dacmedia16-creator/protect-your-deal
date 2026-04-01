

## Plano: Opção de retirar convites do painel (sem excluir a ficha)

Adicionar um botão para "ocultar" convites do painel, mudando o status para `arquivado`. A ficha permanece intacta no sistema.

### Alterações

**1. `src/pages/Convites.tsx`**

- **Nova mutation `arquivarMutation`**: Atualiza `convites_parceiro.status` para `'arquivado'` e invalida as queries de convites
- **Botão nos cards**: Adicionar ícone `EyeOff` (lucide) nos cards de convites (recebidos em andamento, histórico, enviados) com tooltip "Retirar do painel"
- **Filtros**: Adicionar `c.status !== 'arquivado'` nos filtros de categorização (linhas 305-336) para não exibir convites arquivados
- **Import**: Adicionar `EyeOff` do lucide-react

**2. Lógica da mutation**
```typescript
const arquivarMutation = useMutation({
  mutationFn: async (conviteId: string) => {
    await supabase
      .from('convites_parceiro')
      .update({ status: 'arquivado' })
      .eq('id', conviteId);
  },
  onSuccess: () => {
    toast.success('Convite retirado do painel');
    queryClient.invalidateQueries({ queryKey: ['convites-recebidos'] });
    queryClient.invalidateQueries({ queryKey: ['convites-enviados'] });
    queryClient.invalidateQueries({ queryKey: ['convites-pendentes-count'] });
  },
});
```

**3. Onde aparece o botão**
- Cards de convites **em andamento** (recebidos aceitos)
- Cards do **histórico** (recebidos completos/recusados/expirados)
- Cards de convites **enviados** (aceitos e outros)
- **Não** nos pendentes recebidos (ainda precisam de ação)

