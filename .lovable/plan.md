

## Combinar Link Direto por Afiliado + Cupons Promocionais

### Conceito

O afiliado terá **dois tipos de link**:
1. **Link direto** (`?aff=AFILIADO_ID`) — link principal, simples, não depende de cupom existir. O sistema busca automaticamente o cupom de rastreamento do afiliado no backend.
2. **Link com cupom promocional** (`?ref=CODIGO`) — para campanhas com desconto real (ex: `?ref=PROMO20`). Funciona como já funciona hoje.

### Como funciona

```text
Afiliado compartilha link
        │
        ├── ?aff=UUID ──► Backend busca cupom de rastreamento do afiliado
        │                  (0% desconto, só comissão)
        │                  Se não encontrar → registra sem afiliado (fallback)
        │
        └── ?ref=CODIGO ──► Valida cupom normalmente (pode ter desconto real)
```

### Mudanças

#### 1. Dashboard do afiliado — link principal por `?aff=`
**Arquivo:** `src/pages/afiliado/AfiliadoDashboard.tsx`
- O link principal passa a ser `{origin}/registro-tipo?aff={afiliado.id}`
- Sempre visível (não depende de ter cupom ativo)
- Se tiver cupons promocionais (com desconto > 0.01), mostrar links adicionais com `?ref=CODIGO`

#### 2. Páginas de registro — suportar `?aff=` além de `?ref=`
**Arquivos:** `src/pages/auth/RegistroCorretorAutonomo.tsx`, `src/pages/auth/RegistroImobiliaria.tsx`
- Ler `searchParams.get('aff')` (ID do afiliado)
- Se `?aff=` presente: chamar RPC ou query para buscar o cupom de rastreamento do afiliado (primeiro cupom ativo com `valor_desconto <= 0.01`)
- Se encontrar, auto-preencher `codigoCupom` com o código encontrado e ativar `cupomAutoRef`
- Se não encontrar, ignorar silenciosamente (fallback sem afiliado)
- `?ref=` continua funcionando normalmente para cupons promocionais

#### 3. Propagar `?aff=` no seletor de tipo
**Arquivo:** `src/pages/auth/RegistroTipo.tsx`
- Ler `?aff=` e propagá-lo nas URLs de navegação para `/registro-autonomo` e `/registro`

#### 4. Nova RPC para buscar cupom por afiliado_id
**Migration SQL:**
- Criar função `get_cupom_by_afiliado(afiliado_uuid UUID)` que retorna o código do cupom de rastreamento (primeiro cupom ativo do afiliado)
- Security definer, acessível por anon/authenticated

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/afiliado/AfiliadoDashboard.tsx` | Link principal `?aff=ID`, links promo separados |
| `src/pages/auth/RegistroCorretorAutonomo.tsx` | Suporte a `?aff=` com lookup de cupom |
| `src/pages/auth/RegistroImobiliaria.tsx` | Suporte a `?aff=` com lookup de cupom |
| `src/pages/auth/RegistroTipo.tsx` | Propagar param `aff` |
| Migration SQL | Nova RPC `get_cupom_by_afiliado` |

### O que NÃO muda
- Edge functions de registro (recebem `codigo_cupom` como antes)
- Webhook de pagamento (comissões intactas)
- Tabelas existentes (só adiciona uma RPC)
- Cupons promocionais continuam funcionando via `?ref=`

