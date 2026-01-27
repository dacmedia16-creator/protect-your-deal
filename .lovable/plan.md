
# Correção: Busca de Código da Imobiliária no Registro Vinculado

## Problema Identificado

A página de registro vinculado (`RegistroVinculado.tsx`) está consultando diretamente a view `imobiliarias_publicas`, mas essa view herda as políticas RLS da tabela base `imobiliarias`. Como o usuário não está autenticado durante o registro, a consulta retorna vazia mesmo quando o código existe.

### Causa Técnica
- Tabela `imobiliarias` tem RLS ativo
- Políticas de SELECT: apenas super_admin ou usuários da própria imobiliária
- View `imobiliarias_publicas` herda essas restrições
- Usuário não autenticado = nenhuma política permite acesso

## Solução

Alterar o frontend para usar a função RPC `get_imobiliarias_publicas()` que é **SECURITY DEFINER** e bypassa RLS.

### Mudança no Arquivo

**Arquivo:** `src/pages/auth/RegistroVinculado.tsx`

**De (código atual):**
```typescript
const { data, error } = await supabase
  .from('imobiliarias_publicas')
  .select('id, nome')
  .eq('codigo', codigo)
  .maybeSingle();
```

**Para (código corrigido):**
```typescript
const { data: imobiliarias, error } = await supabase
  .rpc('get_imobiliarias_publicas');

if (error) throw error;

// Filtrar pelo código no resultado
const imobiliaria = imobiliarias?.find(
  (i: { codigo: number }) => i.codigo === codigo
);

if (!imobiliaria) {
  setCodigoError('Código não encontrado');
  setImobiliariaEncontrada(null);
} else {
  setImobiliariaEncontrada({ id: imobiliaria.id, nome: imobiliaria.nome });
}
```

---

## Por que essa solução funciona

| Método | RLS | Usuário Anônimo |
|--------|-----|-----------------|
| View `imobiliarias_publicas` | Herda da tabela | ❌ Bloqueado |
| Função `get_imobiliarias_publicas()` | SECURITY DEFINER | ✅ Funciona |

---

## Impacto

- Corrige o registro de corretores vinculados
- Não afeta outras funcionalidades
- Mantém segurança (apenas dados públicos são expostos: código, nome, logo)
